import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService, SharedConfigModule } from '@nam088/config';
import { AUTH_GRPC_CLIENT_TOKEN, createAuthGrpcClientOptions } from '@nam088/grpc';
import { buildDatabaseConfig, ProcessedMessageEntity, UserEntity } from '@nam088/postgresql';
import { SharedRabbitMqModule } from '@nam088/rabbitmq';
import { SharedRedisModule } from '@nam088/redis';
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GrpcClientWrapperService } from './clients/grpc-client-wrapper.service';
import { RequestContextService } from './context/request-context.service';
import { HttpLoggingInterceptor } from './interceptors/http-logging.interceptor';
import { GatewayAuthModule } from './modules/auth/gateway-auth.module';
import { UserEventsModule } from './modules/user-events/user-events.module';

@Module({
    imports: [
        SharedConfigModule.forRoot(),
        SharedRedisModule.forRoot(),
        SharedRabbitMqModule.forRoot(),
        ClientsModule.registerAsync([
            {
                name: AUTH_GRPC_CLIENT_TOKEN,
                inject: [AppConfigService],
                useFactory: (appConfigService: AppConfigService) =>
                    createAuthGrpcClientOptions(__dirname, appConfigService.getAuthGrpcEndpoint()),
            },
        ]),
        MikroOrmModule.forRootAsync({
            driver: PostgreSqlDriver,
            inject: [AppConfigService],
            useFactory: (appConfigService: AppConfigService) => buildDatabaseConfig(appConfigService),
        }),
        MikroOrmModule.forFeature([UserEntity, ProcessedMessageEntity]),
        GatewayAuthModule,
        UserEventsModule,
    ],
    controllers: [AppController],
    providers: [AppService, GrpcClientWrapperService, RequestContextService, HttpLoggingInterceptor],
})
export class AppModule {}
