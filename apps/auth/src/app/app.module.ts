import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService, SharedConfigModule } from '@nam088/config';
import { buildDatabaseConfig, IdempotencyKeyEntity, OutboxEventEntity, UserEntity } from '@nam088/postgresql';
import { SharedRabbitMqModule } from '@nam088/rabbitmq';
import { SharedRedisModule } from '@nam088/redis';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { PingAuthCommandHandler } from './cqrs/commands/ping-auth.handler';
import { GetAuthStatusQueryHandler } from './cqrs/queries/get-auth-status.handler';
import { AuthModule } from './modules/auth/auth.module';
import { OutboxModule } from './modules/outbox/outbox.module';

const commandHandlers = [PingAuthCommandHandler];
const queryHandlers = [GetAuthStatusQueryHandler];

@Module({
    imports: [
        SharedConfigModule.forRoot(),
        SharedRedisModule.forRoot(),
        SharedRabbitMqModule.forRoot(),
        CqrsModule,
        MikroOrmModule.forRootAsync({
            driver: PostgreSqlDriver,
            inject: [AppConfigService],
            useFactory: (appConfigService: AppConfigService) => buildDatabaseConfig(appConfigService),
        }),
        MikroOrmModule.forFeature([UserEntity, IdempotencyKeyEntity, OutboxEventEntity]),
        AuthModule,
        OutboxModule,
    ],
    providers: [...commandHandlers, ...queryHandlers],
})
export class AppModule {}
