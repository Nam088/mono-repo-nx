import { AUTH_GRPC_CLIENT_TOKEN } from '@nam088/grpc';
import { ClientGrpc } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { GrpcClientWrapperService } from '../../../clients/grpc-client-wrapper.service';
import { AuthGatewayService } from './auth-gateway.service';

describe('AuthGatewayService', () => {
    let service: AuthGatewayService;
    const authGrpcServiceMock = {
        getStatus: vi.fn(() => of({ message: 'ok' })),
        getUserPermissions: vi.fn(() => of({ permissions: ['user:read'] })),
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
                AuthGatewayService,
                { provide: AUTH_GRPC_CLIENT_TOKEN, useValue: grpcClientMock },
                { provide: GrpcClientWrapperService, useValue: grpcWrapperMock },
            ],
        }).compile();

        service = app.get<AuthGatewayService>(AuthGatewayService);
        service.onModuleInit();
    });

    describe('getStatus', () => {
        it('should proxy getStatus through wrapper', async () => {
            const result = await service.getStatus();
            expect(result).toEqual({ message: 'ok' });
            expect(grpcWrapperMock.execute).toHaveBeenCalled();
        });
    });

    describe('getUserPermissions', () => {
        it('should proxy getUserPermissions through wrapper', async () => {
            const result = await service.getUserPermissions({ userId: 'u1', sid: 's1' });
            expect(result).toEqual({ permissions: ['user:read'] });
            expect(grpcWrapperMock.execute).toHaveBeenCalled();
        });
    });
});
