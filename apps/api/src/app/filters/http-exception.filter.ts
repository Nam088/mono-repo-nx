import { errorResponse } from '@nam088/utils';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request & { headers?: Record<string, string | string[] | undefined> }>();
        const traceId = this.extractTraceId(request.headers?.['x-request-id']);

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const details =
            typeof exceptionResponse === 'object' && exceptionResponse !== null ? exceptionResponse : undefined;

        response.status(status).json(
            errorResponse(
                {
                    code: this.buildErrorCode(status),
                    message: exception.message,
                    details,
                },
                exception.message,
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
            case HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case HttpStatus.CONFLICT:
                return 'CONFLICT';
            case HttpStatus.PRECONDITION_FAILED:
                return 'PRECONDITION_FAILED';
            case HttpStatus.TOO_MANY_REQUESTS:
                return 'TOO_MANY_REQUESTS';
            case HttpStatus.SERVICE_UNAVAILABLE:
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
