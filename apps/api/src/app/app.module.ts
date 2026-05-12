import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService, SharedConfigModule } from '@nam088/config';
import { PermissionModule, PolicyModule } from '@nam088/permission';
import { buildDatabaseConfig, UserEntity } from '@nam088/postgresql';
import { SharedRabbitMqModule } from '@nam088/rabbitmq';
import { SharedRedisModule } from '@nam088/redis';
import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestContextModule } from './context/request-context.module';
import { HttpLoggingInterceptor } from './interceptors/http-logging.interceptor';
import { AbacDemoModule } from './modules/abac-demo/abac-demo.module';
import { AuthModule } from './modules/auth/auth.module';
import { GrpcPermissionsResolverService } from './modules/auth/services/grpc-permissions-resolver.service';
import { UserPolicy } from './modules/security/policies/user.policy';

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
        // Global Permission configuration
        PermissionModule.forRoot({
            resolver: GrpcPermissionsResolverService,
            imports: [AuthModule],
        }),
        // Global ABAC Policy configuration
        PolicyModule.forRoot({
            policies: [UserPolicy],
            imports: [MikroOrmModule.forFeature([UserEntity])],
        }),
        AbacDemoModule,
    ],
    controllers: [AppController],
    providers: [AppService, HttpLoggingInterceptor],
})
export class AppModule {}
