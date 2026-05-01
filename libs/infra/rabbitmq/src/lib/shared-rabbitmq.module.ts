import { AppConfigService } from '@nam088/config';
import { DynamicModule, Global, Module } from '@nestjs/common';
import type { ChannelModel } from 'amqplib';
import { connect } from 'amqplib';

import { RABBITMQ_CHANNEL, RABBITMQ_CONNECTION } from './rabbitmq.constants';
import { RabbitMqService } from './rabbitmq.service';

@Global()
@Module({})
export class SharedRabbitMqModule {
    static forRoot(): DynamicModule {
        return {
            module: SharedRabbitMqModule,
            providers: [
                {
                    provide: RABBITMQ_CONNECTION,
                    inject: [AppConfigService],
                    useFactory: async (appConfigService: AppConfigService) => {
                        return connect(appConfigService.getRabbitMqUrl());
                    },
                },
                {
                    provide: RABBITMQ_CHANNEL,
                    inject: [RABBITMQ_CONNECTION],
                    useFactory: async (connection: ChannelModel) => {
                        return connection.createChannel();
                    },
                },
                RabbitMqService,
            ],
            exports: [RABBITMQ_CONNECTION, RABBITMQ_CHANNEL, RabbitMqService],
        };
    }
}
