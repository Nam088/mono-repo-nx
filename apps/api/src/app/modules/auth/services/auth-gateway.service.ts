import { auth, AUTH_GRPC_CLIENT_TOKEN, AUTH_GRPC_SERVICE_NAME } from '@nam088/grpc';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import { GrpcClientWrapperService } from '../../../clients/grpc-client-wrapper.service';
import type { NestGrpcUnaryClient } from '../../../clients/nest-grpc-unary-client.type';

@Injectable()
export class AuthGatewayService implements OnModuleInit {
    private authGrpcService!: NestGrpcUnaryClient<auth.v1.AuthServiceClient>;

    constructor(
        @Inject(AUTH_GRPC_CLIENT_TOKEN) private readonly authClient: ClientGrpc,
        private readonly grpcClientWrapperService: GrpcClientWrapperService,
    ) {}

    onModuleInit(): void {
        this.authGrpcService =
            this.authClient.getService<NestGrpcUnaryClient<auth.v1.AuthServiceClient>>(AUTH_GRPC_SERVICE_NAME);
    }

    async getStatus(): Promise<auth.v1.GetStatusResponse> {
        return this.grpcClientWrapperService.execute((metadata) => this.authGrpcService.getStatus({}, metadata));
    }

    async pingAuth(name: string): Promise<auth.v1.PingResponse> {
        return this.grpcClientWrapperService.execute((metadata) => this.authGrpcService.ping({ name }, metadata));
    }

    async registerAuth(data: auth.v1.RegisterRequest): Promise<auth.v1.RegisterResponse> {
        return this.grpcClientWrapperService.execute((metadata) => this.authGrpcService.register(data, metadata));
    }

    async loginAuth(data: auth.v1.LoginRequest): Promise<auth.v1.LoginResponse> {
        return this.grpcClientWrapperService.execute((metadata) => this.authGrpcService.login(data, metadata));
    }

    async refreshAuth(data: auth.v1.RefreshTokenRequest): Promise<auth.v1.LoginResponse> {
        return this.grpcClientWrapperService.execute((metadata) => this.authGrpcService.refreshToken(data, metadata));
    }

    async logoutAuth(data: auth.v1.LogoutRequest): Promise<auth.v1.LogoutResponse> {
        return this.grpcClientWrapperService.execute((metadata) => this.authGrpcService.logout(data, metadata));
    }

    async validateAccessToken(data: auth.v1.ValidateAccessTokenRequest): Promise<auth.v1.ValidateAccessTokenResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            this.authGrpcService.validateAccessToken(data, metadata),
        );
    }
}
