import type { Metadata } from '@grpc/grpc-js';
import type { Observable } from 'rxjs';

type UnaryWithMetadata<M> = M extends (request: infer Req) => Observable<infer Res>
    ? (request: Req, metadata?: Metadata) => Observable<Res>
    : M;

/**
 * Maps a protobuf-generated client interface (unary: `(req) => Observable<Res>`) to the shape
 * Nest `ClientGrpc.getService()` actually exposes: `(req, metadata?) => Observable<Res>`.
 */
export type NestGrpcUnaryClient<T> = {
    [K in keyof T]: UnaryWithMetadata<T[K]>;
};
