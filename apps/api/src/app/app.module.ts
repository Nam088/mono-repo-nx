import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService, SharedConfigModule } from '@nam088/config';
import { AUTH_GRPC_CLIENT_TOKEN, createAuthGrpcClientOptions } from '@nam088/grpc';
import { buildDatabaseConfig, UserEntity } from '@nam088/postgresql';
import { SharedRedisModule } from '@nam088/redis';
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [
        SharedConfigModule.forRoot(),
        SharedRedisModule.forRoot(),
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
        MikroOrmModule.forFeature([UserEntity]),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
