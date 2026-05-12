import { status as GrpcStatus } from '@grpc/grpc-js';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    GatewayTimeoutException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
    PreconditionFailedException,
    RequestTimeoutException,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';

import type { GrpcErrorLike } from './errors/grpc-proxy.exception';

export function mapGrpcErrorToHttpException(error: unknown): HttpException {
    if (!error || typeof error !== 'object') {
        return new InternalServerErrorException('Internal server error');
    }

    const grpcError = error as GrpcErrorLike;

    // For 5xx-equivalent errors, always use generic messages to prevent information leakage
    const isInternalError =
        grpcError.code === undefined ||
        [
            GrpcStatus.INTERNAL,
            GrpcStatus.UNKNOWN,
            GrpcStatus.DATA_LOSS,
            GrpcStatus.UNIMPLEMENTED,
            GrpcStatus.UNAVAILABLE,
        ].includes(grpcError.code as number);

    const message = isInternalError
        ? 'Internal server error'
        : grpcError.details || grpcError.message || 'Internal server error';

    switch (grpcError.code) {
        case GrpcStatus.INVALID_ARGUMENT:
            return new BadRequestException(message);
        case GrpcStatus.NOT_FOUND:
            return new NotFoundException(message);
        case GrpcStatus.ALREADY_EXISTS:
            return new ConflictException(message);
        case GrpcStatus.FAILED_PRECONDITION:
            return new PreconditionFailedException(message);
        case GrpcStatus.ABORTED:
            return new ConflictException(message);
        case GrpcStatus.PERMISSION_DENIED:
            return new ForbiddenException(message);
        case GrpcStatus.UNAUTHENTICATED:
            return new UnauthorizedException(message);
        case GrpcStatus.RESOURCE_EXHAUSTED:
            return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
        case GrpcStatus.DEADLINE_EXCEEDED:
            return new RequestTimeoutException(message);
        case GrpcStatus.UNAVAILABLE:
            return new ServiceUnavailableException('Service temporarily unavailable');
        case GrpcStatus.CANCELLED:
            return new GatewayTimeoutException('Request was cancelled');
        default:
            return new InternalServerErrorException('An internal server error occurred');
    }
}

export function isHttpException(error: unknown): error is HttpException {
    return error instanceof HttpException;
}
