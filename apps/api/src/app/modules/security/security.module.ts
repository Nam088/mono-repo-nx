import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppConfigService } from '@nam088/config';
import { AUTH_GRPC_CLIENT_TOKEN, createAuthGrpcClientOptions } from '@nam088/grpc';
import { PermissionModule, PolicyModule } from '@nam088/permission';
import { UserEntity } from '@nam088/postgresql';
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

import { GrpcClientWrapperService } from '../../clients/grpc-client-wrapper.service';
import { UserPolicy } from './policies/user.policy';
import { GrpcPermissionsResolverService } from './services/grpc-permissions-resolver.service';

const authGrpcClientRegistration = ClientsModule.registerAsync([
    {
        name: AUTH_GRPC_CLIENT_TOKEN,
        inject: [AppConfigService],
        useFactory: (appConfigService: AppConfigService) =>
            createAuthGrpcClientOptions(__dirname, appConfigService.getAuthGrpcEndpoint()),
    },
]);

@Module({
    imports: [
        authGrpcClientRegistration,
        // Centralized Permission configuration
        PermissionModule.forRoot({
            resolver: GrpcPermissionsResolverService,
            // Provide necessary dependencies to PermissionModule
            imports: [authGrpcClientRegistration],
            providers: [GrpcClientWrapperService],
        }),
        // Centralized ABAC Policy configuration
        PolicyModule.forRoot({
            policies: [UserPolicy],
            imports: [MikroOrmModule.forFeature([UserEntity])],
        }),
    ],
    providers: [GrpcPermissionsResolverService, GrpcClientWrapperService],
    exports: [PermissionModule, PolicyModule],
})
export class SecurityModule {}
