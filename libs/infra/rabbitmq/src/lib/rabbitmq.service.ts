import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Channel, ChannelModel } from 'amqplib';

import { RABBITMQ_CHANNEL, RABBITMQ_CONNECTION } from './rabbitmq.constants';

@Injectable()
export class RabbitMqService implements OnModuleDestroy {
    constructor(
        @Inject(RABBITMQ_CONNECTION) private readonly connection: ChannelModel,
        @Inject(RABBITMQ_CHANNEL) private readonly channel: Channel,
    ) {}

    getConnection(): ChannelModel {
        return this.connection;
    }

    getChannel(): Channel {
        return this.channel;
    }

    async onModuleDestroy(): Promise<void> {
        await this.channel.close().catch(() => undefined);
        await this.connection.close().catch(() => undefined);
    }
}
