import { auth, AUTH_GRPC_CLIENT_TOKEN, AUTH_GRPC_SERVICE_NAME } from '@nam088/grpc';
import { PermissionsResolveContext, PermissionsResolver } from '@nam088/permission';
import { Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import { GrpcClientWrapperService } from '../../../clients/grpc-client-wrapper.service';
import type { NestGrpcUnaryClient } from '../../../clients/nest-grpc-unary-client.type';

@Injectable()
export class GrpcPermissionsResolverService implements PermissionsResolver, OnModuleInit {
    private authGrpcService!: NestGrpcUnaryClient<auth.v1.AuthServiceClient>;

    constructor(
        @Inject(AUTH_GRPC_CLIENT_TOKEN) private readonly authClient: ClientGrpc,
        private readonly grpcClientWrapperService: GrpcClientWrapperService,
    ) {}

    onModuleInit(): void {
        this.authGrpcService =
            this.authClient.getService<NestGrpcUnaryClient<auth.v1.AuthServiceClient>>(AUTH_GRPC_SERVICE_NAME);
    }

    async resolve(ctx: PermissionsResolveContext): Promise<readonly string[]> {
        const sid = typeof ctx.user.sid === 'string' ? ctx.user.sid : '';
        if (!sid) {
            throw new UnauthorizedException('invalid_access_token');
        }

        const result = await this.grpcClientWrapperService.execute((metadata) =>
            this.authGrpcService.getUserPermissions(
                {
                    userId: ctx.user.sub,
                    sid,
                },
                metadata,
            ),
        );

        return result.permissions ?? [];
    }
}
