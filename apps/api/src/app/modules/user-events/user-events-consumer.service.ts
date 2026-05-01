import { EntityManager } from '@mikro-orm/postgresql';
import { ProcessedMessageEntity } from '@nam088/postgresql';
import { RabbitMqService } from '@nam088/rabbitmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConsumeMessage } from 'amqplib';

@Injectable()
export class UserEventsConsumerService implements OnModuleInit {
    private readonly logger = new Logger(UserEventsConsumerService.name);
    private readonly queueName = 'api.user-events';
    private readonly consumerName = 'api.user-events-consumer';

    constructor(
        private readonly rabbitMqService: RabbitMqService,
        private readonly em: EntityManager,
    ) {}

    async onModuleInit(): Promise<void> {
        const channel = this.rabbitMqService.getChannel();
        await channel.assertExchange('auth.events', 'topic', { durable: true });
        await channel.assertQueue(this.queueName, { durable: true });
        await channel.bindQueue(this.queueName, 'auth.events', 'user.registered');
        await channel.bindQueue(this.queueName, 'auth.events', 'user.logged.in');

        await channel.consume(
            this.queueName,
            (message) => {
                void this.handleMessage(message);
            },
            { noAck: false },
        );
    }

    private async handleMessage(message: ConsumeMessage | null): Promise<void> {
        if (!message) {
            return;
        }

        const channel = this.rabbitMqService.getChannel();
        const messageId = message.properties.messageId;
        if (!messageId) {
            channel.ack(message);
            return;
        }

        try {
            const em = this.em.fork();
            const existing = await em.findOne(ProcessedMessageEntity, {
                messageId,
                consumerName: this.consumerName,
            });
            if (existing) {
                channel.ack(message);
                return;
            }

            const payload = JSON.parse(message.content.toString()) as Record<string, unknown>;
            this.logger.log(`Consumed ${message.fields.routingKey} event for user ${String(payload.userId ?? '')}`);

            em.persist(
                em.create(ProcessedMessageEntity, {
                    messageId,
                    consumerName: this.consumerName,
                    processedAt: new Date(),
                }),
            );
            await em.flush();
            channel.ack(message);
        } catch (error) {
            this.logger.error('Failed to process user event', error);
            channel.nack(message, false, true);
        }
    }
}
