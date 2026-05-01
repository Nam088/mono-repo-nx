export type GrpcErrorLike = {
    code?: number;
    details?: string;
    message?: string;
};

export class GrpcProxyException extends Error {
    constructor(public readonly grpcError: GrpcErrorLike) {
        super(grpcError.details || grpcError.message || 'gRPC upstream error');
        this.name = 'GrpcProxyException';
    }
}
