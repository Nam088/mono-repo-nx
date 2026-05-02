import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService, SharedConfigModule } from '@nam088/config';
import { buildDatabaseConfig, UserEntity } from '@nam088/postgresql';
import { SharedRabbitMqModule } from '@nam088/rabbitmq';
import { SharedRedisModule } from '@nam088/redis';
import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestContextModule } from './context/request-context.module';
import { HttpLoggingInterceptor } from './interceptors/http-logging.interceptor';
import { AuthModule } from './modules/auth/auth.module';

@Module({
    imports: [
        RequestContextModule,
        SharedConfigModule.forRoot(),
        SharedRedisModule.forRoot(),
        SharedRabbitMqModule.forRoot(),
        MikroOrmModule.forRootAsync({
            driver: PostgreSqlDriver,
            inject: [AppConfigService],
            useFactory: (appConfigService: AppConfigService) => buildDatabaseConfig(appConfigService),
        }),
        MikroOrmModule.forFeature([UserEntity]),
        AuthModule,
    ],
    controllers: [AppController],
    providers: [AppService, HttpLoggingInterceptor],
})
export class AppModule {}
