import { randomUUID } from 'node:crypto';

import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { RequestContextService } from '../context/request-context.service';

type RequestLike = {
    method?: string;
    originalUrl?: string;
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
    setHeader: (name: string, value: string) => void;
};

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HttpLoggingInterceptor.name);
    constructor(private readonly requestContextService: RequestContextService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType<'http' | 'rpc'>() !== 'http') {
            return next.handle();
        }

        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<RequestLike>();
        const response = httpContext.getResponse<ResponseLike>();
        const traceId = this.extractTraceId(request.headers?.['x-request-id']);
        response.setHeader('x-request-id', traceId);
        const method = request.method ?? 'UNKNOWN';
        const url = request.originalUrl ?? 'unknown-url';
        const safeBody = this.sanitize(request.body);
        const safeQuery = this.sanitize(request.query);
        const startedAt = Date.now();

        this.logger.log(
            JSON.stringify({
                type: 'http_request',
                traceId,
                method,
                url,
                body: safeBody,
                query: safeQuery,
            }),
        );

        return this.requestContextService.run({ traceId }, () =>
            next.handle().pipe(
                tap(() => {
                    this.logger.log(
                        JSON.stringify({
                            type: 'http_response',
                            traceId,
                            method,
                            url,
                            durationMs: Date.now() - startedAt,
                            status: 'success',
                        }),
                    );
                }),
                catchError((error: unknown) => {
                    const durationMs = Date.now() - startedAt;
                    if (error instanceof HttpException) {
                        this.logger.error(
                            JSON.stringify({
                                type: 'http_response',
                                traceId,
                                method,
                                url,
                                durationMs,
                                status: 'error',
                                httpStatus: error.getStatus(),
                                message: error.message,
                            }),
                        );
                    } else if (error instanceof Error) {
                        this.logger.error(
                            JSON.stringify({
                                type: 'http_response',
                                traceId,
                                method,
                                url,
                                durationMs,
                                status: 'error',
                                message: error.message,
                            }),
                        );
                    } else {
                        this.logger.error(
                            JSON.stringify({
                                type: 'http_response',
                                traceId,
                                method,
                                url,
                                durationMs,
                                status: 'error',
                                message: 'non-error throwable',
                            }),
                        );
                    }

                    return throwError(() => error);
                }),
            ),
        );
    }

    private sanitize(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
        if (!data) {
            return undefined;
        }

        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (this.isSensitiveKey(key)) {
                sanitized[key] = '[REDACTED]';
                continue;
            }
            sanitized[key] = value;
        }

        return sanitized;
    }

    private isSensitiveKey(key: string): boolean {
        const lowered = key.toLowerCase();
        return lowered.includes('password') || lowered.includes('token') || lowered.includes('secret');
    }

    private extractTraceId(value: string | string[] | undefined): string {
        if (Array.isArray(value)) {
            return value[0] || randomUUID();
        }
        return value || randomUUID();
    }
}
