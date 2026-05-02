import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';

import { AppService } from './app.service';
import { AuthGatewayService } from './modules/auth/services/auth-gateway.service';

describe('AppService', () => {
    let service: AppService;
    const authGatewayMock = {
        getStatus: vi.fn(async () => ({ message: 'ok' })),
    };

    beforeAll(async () => {
        const app = await Test.createTestingModule({
            providers: [AppService, { provide: AuthGatewayService, useValue: authGatewayMock }],
        }).compile();

        service = app.get<AppService>(AppService);
    });

    describe('getData', () => {
        it('should proxy getStatus through auth gateway', async () => {
            const result = await service.getData();
            expect(result).toEqual({ message: 'ok' });
            expect(authGatewayMock.getStatus).toHaveBeenCalled();
        });
    });
});
