import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AuthGatewayService } from '../services/auth-gateway.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthGatewayService,
                    useValue: {
                        pingAuth: vi.fn(async () => ({ message: 'pong' })),
                        registerAuth: vi.fn(async () => ({})),
                        loginAuth: vi.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })),
                        refreshAuth: vi.fn(async () => ({})),
                        logoutAuth: vi.fn(async () => ({})),
                    },
                },
            ],
        }).compile();
    });

    describe('loginAuth', () => {
        it('should call auth gateway with credentials', async () => {
            const controller = app.get<AuthController>(AuthController);
            const authGateway = app.get(AuthGatewayService) as { loginAuth: ReturnType<typeof vi.fn> };
            const body = { email: 'u@example.com', password: 'secret' };
            await controller.loginAuth(body);
            expect(authGateway.loginAuth).toHaveBeenCalledWith({
                email: 'u@example.com',
                password: 'secret',
            });
        });
    });
});
