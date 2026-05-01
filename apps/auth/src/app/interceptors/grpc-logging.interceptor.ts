import { Metadata } from '@grpc/grpc-js';
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class GrpcLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(GrpcLoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType<'rpc' | 'http'>() !== 'rpc') {
            return next.handle();
        }

        const rpcContext = context.switchToRpc();
        const handlerName = context.getHandler().name;
        const safeData = this.sanitize(rpcContext.getData<Record<string, unknown>>());
        const traceId = this.extractTraceId(rpcContext.getContext());
        this.logger.log(
            JSON.stringify({
                type: 'grpc_request',
                traceId,
                handler: handlerName,
                payload: safeData,
            }),
        );

        return next.handle().pipe(
            tap(() => {
                this.logger.log(
                    JSON.stringify({
                        type: 'grpc_response',
                        traceId,
                        handler: handlerName,
                        status: 'success',
                    }),
                );
            }),
            catchError((error: unknown) => {
                if (error instanceof Error) {
                    this.logger.error(
                        JSON.stringify({
                            type: 'grpc_response',
                            traceId,
                            handler: handlerName,
                            status: 'error',
                            message: error.message,
                        }),
                        error.stack,
                    );
                } else {
                    this.logger.error(
                        JSON.stringify({
                            type: 'grpc_response',
                            traceId,
                            handler: handlerName,
                            status: 'error',
                            message: 'non-error throwable',
                        }),
                    );
                }

                return throwError(() => error);
            }),
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
        return lowered.includes('password') || lowered.includes('token');
    }

    private extractTraceId(rpcContext: unknown): string | undefined {
        if (rpcContext && typeof rpcContext === 'object') {
            const metadata = (rpcContext as { metadata?: Metadata }).metadata;
            const traceId = metadata?.get('x-request-id')?.[0];
            return typeof traceId === 'string' ? traceId : undefined;
        }
        return undefined;
    }
}
