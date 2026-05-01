import { Metadata } from '@grpc/grpc-js';
import { HttpException, Injectable } from '@nestjs/common';
import { firstValueFrom, Observable } from 'rxjs';

import { RequestContextService } from '../context/request-context.service';
import { GrpcErrorLike, GrpcProxyException } from '../errors/grpc-proxy.exception';

@Injectable()
export class GrpcClientWrapperService {
    constructor(private readonly requestContextService: RequestContextService) {}

    async execute<T>(callFactory: (metadata: Metadata) => Observable<T>): Promise<T> {
        const metadata = new Metadata();
        const traceId = this.requestContextService.getTraceId();
        if (traceId) {
            metadata.set('x-request-id', traceId);
        }

        try {
            return await firstValueFrom(callFactory(metadata));
        } catch (error: unknown) {
            if (error instanceof HttpException) {
                throw error;
            }

            if (error && typeof error === 'object') {
                throw new GrpcProxyException(error as GrpcErrorLike);
            }

            throw new GrpcProxyException({ message: 'Unknown upstream error' });
        }
    }
}
