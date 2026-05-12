import { errorResponse } from '@nam088/utils';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

import { GrpcProxyException } from '../errors/grpc-proxy.exception';
import { mapGrpcErrorToHttpException } from '../grpc-to-http-exception';

@Catch(GrpcProxyException)
export class GrpcProxyExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GrpcProxyExceptionFilter.name);

    catch(exception: GrpcProxyException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request & { headers?: Record<string, string | string[] | undefined> }>();
        const traceId = this.extractTraceId(request.headers?.['x-request-id']);

        this.logger.error(
            `gRPC error caught in proxy filter: [${exception.grpcError.code}] ${exception.grpcError.details || exception.grpcError.message}`,
            exception.stack,
            { traceId, url: request.url },
        );

        const mappedException = mapGrpcErrorToHttpException(exception.grpcError);
        const status = mappedException.getStatus();
        const exceptionResponse = mappedException.getResponse();
        const details =
            typeof exceptionResponse === 'object' && exceptionResponse !== null ? exceptionResponse : undefined;

        response.status(status).json(
            errorResponse(
                {
                    code: this.buildErrorCode(status),
                    message: mappedException.message,
                    details,
                },
                mappedException.message,
                {
                    timestamp: new Date().toISOString(),
                    path: request.url,
                    traceId,
                },
            ),
        );
    }

    private buildErrorCode(status: number): string {
        switch (status) {
            case 400:
                return 'BAD_REQUEST';
            case 401:
                return 'UNAUTHORIZED';
            case 403:
                return 'FORBIDDEN';
            case 404:
                return 'NOT_FOUND';
            case 409:
                return 'CONFLICT';
            case 412:
                return 'PRECONDITION_FAILED';
            case 429:
                return 'TOO_MANY_REQUESTS';
            case 503:
                return 'SERVICE_UNAVAILABLE';
            default:
                return 'INTERNAL_SERVER_ERROR';
        }
    }

    private extractTraceId(value: string | string[] | undefined): string | undefined {
        if (Array.isArray(value)) {
            return value[0];
        }
        return value;
    }
}
