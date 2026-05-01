import { EntityManager } from '@mikro-orm/postgresql';
import { OutboxEventEntity } from '@nam088/postgresql';
import { RabbitMqService } from '@nam088/rabbitmq';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OutboxPublisherService.name);
    private intervalId?: NodeJS.Timeout;
    private isPublishing = false;

    constructor(
        private readonly em: EntityManager,
        private readonly rabbitMqService: RabbitMqService,
    ) {}

    async onModuleInit(): Promise<void> {
        const channel = this.rabbitMqService.getChannel();
        await channel.assertExchange('auth.events', 'topic', { durable: true });

        this.intervalId = setInterval(() => {
            void this.publishPendingBatch();
        }, 3000);
    }

    onModuleDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    private async publishPendingBatch(): Promise<void> {
        if (this.isPublishing) {
            return;
        }

        this.isPublishing = true;
        try {
            const em = this.em.fork();
            const now = new Date();
            const pendingEvents = await em.find(
                OutboxEventEntity,
                {
                    status: 'pending',
                    $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
                },
                {
                    orderBy: { createdAt: 'asc' },
                    limit: 20,
                },
            );
            if (!pendingEvents.length) {
                return;
            }

            const channel = this.rabbitMqService.getChannel();
            for (const event of pendingEvents) {
                try {
                    const publishResult = channel.publish(
                        'auth.events',
                        this.toRoutingKey(event.eventType),
                        Buffer.from(JSON.stringify(event.payload)),
                        {
                            contentType: 'application/json',
                            persistent: true,
                            messageId: event.id,
                            timestamp: Date.now(),
                            type: event.eventType,
                        },
                    );
                    if (!publishResult) {
                        throw new Error('channel.publish returned false');
                    }

                    event.status = 'published';
                    event.publishedAt = new Date();
                } catch (error) {
                    event.retryCount += 1;
                    if (event.retryCount >= 5) {
                        event.status = 'failed';
                        this.logger.error(`Outbox event ${event.id} permanently failed`, error);
                    } else {
                        const backoffMs = Math.min(60_000, 1_000 * 2 ** event.retryCount);
                        event.nextRetryAt = new Date(Date.now() + backoffMs);
                    }
                }
            }

            await em.flush();
        } finally {
            this.isPublishing = false;
        }
    }

    private toRoutingKey(eventType: string): string {
        return eventType
            .replace(/([a-z0-9])([A-Z])/g, '$1.$2')
            .replace(/_/g, '.')
            .toLowerCase();
    }
}
