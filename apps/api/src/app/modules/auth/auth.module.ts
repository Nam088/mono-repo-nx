import { AppConfigService } from '@nam088/config';
import { AUTH_GRPC_CLIENT_TOKEN, createAuthGrpcClientOptions } from '@nam088/grpc';
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';

import { GrpcClientWrapperService } from '../../clients/grpc-client-wrapper.service';
import { AuthController } from './controllers/auth.controller';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { AuthGatewayService } from './services/auth-gateway.service';
import { GrpcPermissionsResolverService } from './services/grpc-permissions-resolver.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt-access' }),
        ClientsModule.registerAsync([
            {
                name: AUTH_GRPC_CLIENT_TOKEN,
                inject: [AppConfigService],
                useFactory: (appConfigService: AppConfigService) =>
                    createAuthGrpcClientOptions(__dirname, appConfigService.getAuthGrpcEndpoint()),
            },
        ]),
    ],
    controllers: [AuthController],
    providers: [
        GrpcClientWrapperService,
        AuthGatewayService,
        GrpcPermissionsResolverService,
        JwtRefreshStrategy,
        JwtAccessGuard,
    ],
    exports: [AuthGatewayService, PassportModule, JwtRefreshStrategy, JwtAccessGuard, GrpcPermissionsResolverService],
})
export class AuthModule {}
