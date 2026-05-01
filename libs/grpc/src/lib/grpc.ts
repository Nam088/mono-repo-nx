import { join } from 'node:path';

import { GrpcOptions, Transport } from '@nestjs/microservices';

export const AUTH_GRPC_CLIENT_TOKEN = 'AUTH_GRPC_CLIENT';
export const AUTH_GRPC_PACKAGE = 'auth.v1';
export const AUTH_GRPC_SERVICE_NAME = 'AuthService';
export const AUTH_GRPC_PROTO_RELATIVE_PATH = 'auth/v1/auth.proto';

export type GrpcEndpoint = {
    host: string;
    port: number;
};
export type GrpcClientTransportOptions = Pick<GrpcOptions, 'transport' | 'options'>;

export function buildGrpcUrl(endpoint: GrpcEndpoint): string {
    return `${endpoint.host}:${endpoint.port}`;
}

export function resolveGrpcProtoPath(baseDir: string, relativePath = AUTH_GRPC_PROTO_RELATIVE_PATH): string {
    return join(baseDir, 'proto', relativePath);
}

export function createAuthGrpcServerOptions(baseDir: string, endpoint: GrpcEndpoint): GrpcOptions {
    return {
        transport: Transport.GRPC,
        options: {
            package: AUTH_GRPC_PACKAGE,
            protoPath: resolveGrpcProtoPath(baseDir),
            url: buildGrpcUrl(endpoint),
        },
    };
}

export function createAuthGrpcClientOptions(baseDir: string, endpoint: GrpcEndpoint): GrpcClientTransportOptions {
    return {
        transport: Transport.GRPC,
        options: {
            package: AUTH_GRPC_PACKAGE,
            protoPath: resolveGrpcProtoPath(baseDir),
            url: buildGrpcUrl(endpoint),
        },
    };
}
