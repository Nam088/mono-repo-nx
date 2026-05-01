import { auth, AUTH_GRPC_CLIENT_TOKEN, AUTH_GRPC_SERVICE_NAME } from '@nam088/grpc';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import { GrpcClientWrapperService } from './clients/grpc-client-wrapper.service';

@Injectable()
export class AppService implements OnModuleInit {
    private authGrpcService!: auth.v1.AuthServiceClient;

    constructor(
        @Inject(AUTH_GRPC_CLIENT_TOKEN) private readonly authClient: ClientGrpc,
        private readonly grpcClientWrapperService: GrpcClientWrapperService,
    ) {}

    onModuleInit(): void {
        this.authGrpcService = this.authClient.getService<auth.v1.AuthServiceClient>(AUTH_GRPC_SERVICE_NAME);
    }

    async getData(): Promise<auth.v1.GetStatusResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            (
                this.authGrpcService.getStatus as unknown as (
                    request: auth.v1.GetStatusRequest,
                    metadata: unknown,
                ) => ReturnType<auth.v1.AuthServiceClient['getStatus']>
            )({}, metadata),
        );
    }

    async pingAuth(name: string): Promise<auth.v1.PingResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            (
                this.authGrpcService.ping as unknown as (
                    request: auth.v1.PingRequest,
                    metadata: unknown,
                ) => ReturnType<auth.v1.AuthServiceClient['ping']>
            )({ name }, metadata),
        );
    }

    async registerAuth(data: auth.v1.RegisterRequest): Promise<auth.v1.RegisterResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            (
                this.authGrpcService.register as unknown as (
                    request: auth.v1.RegisterRequest,
                    metadata: unknown,
                ) => ReturnType<auth.v1.AuthServiceClient['register']>
            )(data, metadata),
        );
    }

    async loginAuth(data: auth.v1.LoginRequest): Promise<auth.v1.LoginResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            (
                this.authGrpcService.login as unknown as (
                    request: auth.v1.LoginRequest,
                    metadata: unknown,
                ) => ReturnType<auth.v1.AuthServiceClient['login']>
            )(data, metadata),
        );
    }

    async refreshAuth(data: auth.v1.RefreshTokenRequest): Promise<auth.v1.LoginResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            (
                this.authGrpcService.refreshToken as unknown as (
                    request: auth.v1.RefreshTokenRequest,
                    metadata: unknown,
                ) => ReturnType<auth.v1.AuthServiceClient['refreshToken']>
            )(data, metadata),
        );
    }

    async logoutAuth(data: auth.v1.LogoutRequest): Promise<auth.v1.LogoutResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            (
                this.authGrpcService.logout as unknown as (
                    request: auth.v1.LogoutRequest,
                    metadata: unknown,
                ) => ReturnType<auth.v1.AuthServiceClient['logout']>
            )(data, metadata),
        );
    }

    async validateAccessToken(data: auth.v1.ValidateAccessTokenRequest): Promise<auth.v1.ValidateAccessTokenResponse> {
        return this.grpcClientWrapperService.execute((metadata) =>
            (
                this.authGrpcService.validateAccessToken as unknown as (
                    request: auth.v1.ValidateAccessTokenRequest,
                    metadata: unknown,
                ) => ReturnType<auth.v1.AuthServiceClient['validateAccessToken']>
            )(data, metadata),
        );
    }
}
