import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService, SharedConfigModule } from '@nam088/config';
import { buildDatabaseConfig, UserEntity } from '@nam088/postgresql';
import { SharedRabbitMqModule } from '@nam088/rabbitmq';
import { SharedRedisModule } from '@nam088/redis';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from './modules/auth/auth.module';
import { PlatformModule } from './modules/platform/platform.module';

@Module({
    imports: [
        SharedConfigModule.forRoot(),
        SharedRedisModule.forRoot(),
        SharedRabbitMqModule.forRoot(),
        CqrsModule,
        PlatformModule,
        MikroOrmModule.forRootAsync({
            driver: PostgreSqlDriver,
            inject: [AppConfigService],
            useFactory: (appConfigService: AppConfigService) => buildDatabaseConfig(appConfigService),
        }),
        MikroOrmModule.forFeature([UserEntity]),
        AuthModule,
    ],
})
export class AppModule {}
