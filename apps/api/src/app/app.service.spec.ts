import { AUTH_GRPC_CLIENT_TOKEN } from '@nam088/grpc';
import { ClientGrpc } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AppService } from './app.service';
import { GrpcClientWrapperService } from './clients/grpc-client-wrapper.service';

describe('AppService', () => {
    let service: AppService;
    const authGrpcServiceMock = {
        getStatus: vi.fn(() => of({ message: 'ok' })),
    };
    const grpcClientMock = {
        getService: vi.fn(() => authGrpcServiceMock),
    } as unknown as ClientGrpc;
    const grpcWrapperMock = {
        execute: vi.fn(async (factory: (metadata: unknown) => unknown) => {
            const stream = factory({});
            return firstValueFrom(stream as ReturnType<typeof of>);
        }),
    };

    beforeAll(async () => {
        const app = await Test.createTestingModule({
            providers: [
                AppService,
                { provide: AUTH_GRPC_CLIENT_TOKEN, useValue: grpcClientMock },
                { provide: GrpcClientWrapperService, useValue: grpcWrapperMock },
            ],
        }).compile();

        service = app.get<AppService>(AppService);
        service.onModuleInit();
    });

    describe('getData', () => {
        it('should proxy getStatus through wrapper', async () => {
            const result = await service.getData();
            expect(result).toEqual({ message: 'ok' });
            expect(grpcWrapperMock.execute).toHaveBeenCalled();
        });
    });
});
