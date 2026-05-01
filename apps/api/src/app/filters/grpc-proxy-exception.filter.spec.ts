import { status as GrpcStatus } from '@grpc/grpc-js';
import { ArgumentsHost, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { GrpcProxyException } from '../errors/grpc-proxy.exception';
import { GrpcProxyExceptionFilter } from './grpc-proxy-exception.filter';
import { HttpExceptionFilter } from './http-exception.filter';

function createHostMocks() {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const response = { status, json };
    const request = { url: '/api/auth/login' };
    const host = {
        switchToHttp: () => ({
            getResponse: () => response,
            getRequest: () => request,
        }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
}

describe('Exception filters', () => {
    it('maps GrpcProxyException to http unauthorized payload', () => {
        const filter = new GrpcProxyExceptionFilter();
        const { host, status, json } = createHostMocks();

        filter.catch(
            new GrpcProxyException({ code: GrpcStatus.UNAUTHENTICATED, details: 'Invalid credentials' }),
            host,
        );

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
            }),
        );
    });

    it('formats HttpException consistently', () => {
        const filter = new HttpExceptionFilter();
        const { host, status, json } = createHostMocks();

        filter.catch(new UnauthorizedException('invalid_access_token'), host);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
            }),
        );
    });
});
