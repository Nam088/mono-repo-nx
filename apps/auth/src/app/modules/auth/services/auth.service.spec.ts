import { status as GrpcStatus } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from './auth.service';

function createAuthService(): AuthService {
    const em = { fork: vi.fn() } as never;
    const jwtService = { verifyAsync: vi.fn(), signAsync: vi.fn() } as never;
    const appConfigService = {
        getJwtConfig: vi.fn(() => ({
            JWT_ACCESS_SECRET: 'access-secret',
            JWT_REFRESH_SECRET: 'refresh-secret',
            JWT_ACCESS_TTL_SECONDS: 900,
            JWT_REFRESH_TTL_SECONDS: 1209600,
            JWT_ISSUER: 'issuer',
            JWT_AUDIENCE: 'audience',
            JWT_ACTIVE_KID: 'v1',
        })),
    } as never;
    const redisService = {
        getClient: vi.fn(() => ({
            incr: vi.fn().mockResolvedValue(1),
            expire: vi.fn().mockResolvedValue(1),
            set: vi.fn(),
            get: vi.fn(),
            del: vi.fn(),
        })),
    } as never;

    return new AuthService(em, jwtService, appConfigService, redisService);
}

function extractRpcCode(error: unknown): number | undefined {
    if (!(error instanceof RpcException)) {
        return undefined;
    }
    const payload = error.getError() as { code?: number };
    return payload?.code;
}

describe('AuthService security flows', () => {
    it('hashes and verifies password with argon2', async () => {
        const service = createAuthService();
        const password = 'StrongPassword@123';
        const passwordHash = await (service as any).hashPassword(password);

        expect(passwordHash).toMatch(/^\$argon2/);
        await expect((service as any).verifyPassword(password, passwordHash)).resolves.toBe(true);
        await expect((service as any).verifyPassword('wrong-password', passwordHash)).resolves.toBe(false);
    });

    it('rejects validateAccessToken when session is missing', async () => {
        const service = createAuthService();
        vi.spyOn(service as any, 'enforceRateLimit' as any).mockResolvedValue(undefined);
        vi.spyOn(service as any, 'verifyAccessToken' as any).mockResolvedValue({
            sub: 'user-1',
            sid: 'sid-1',
            jti: 'access-jti',
            typ: 'access',
        });
        vi.spyOn(service as any, 'getSession' as any).mockResolvedValue(null);

        await expect(service.validateAccessToken({ accessToken: 'token' })).rejects.toBeInstanceOf(RpcException);
        await service
            .validateAccessToken({ accessToken: 'token' })
            .catch((error) => expect(extractRpcCode(error)).toBe(GrpcStatus.UNAUTHENTICATED));
    });

    it('rejects validateAccessToken when sid mismatches', async () => {
        const service = createAuthService();
        vi.spyOn(service as any, 'enforceRateLimit' as any).mockResolvedValue(undefined);
        vi.spyOn(service as any, 'verifyAccessToken' as any).mockResolvedValue({
            sub: 'user-1',
            sid: 'sid-a',
            jti: 'access-jti',
            typ: 'access',
        });
        vi.spyOn(service as any, 'getSession' as any).mockResolvedValue({
            userId: 'user-1',
            sid: 'sid-b',
            accessJtiHash: 'hash',
            jtiHash: 'refresh-hash',
            refreshExpiresAt: Date.now(),
        });

        await service
            .validateAccessToken({ accessToken: 'token' })
            .catch((error) => expect(extractRpcCode(error)).toBe(GrpcStatus.UNAUTHENTICATED));
    });

    it('rejects refreshToken when lock cannot be acquired', async () => {
        const service = createAuthService();
        vi.spyOn(service as any, 'enforceRateLimit' as any).mockResolvedValue(undefined);
        vi.spyOn(service as any, 'verifyRefreshToken' as any).mockResolvedValue({
            sub: 'user-1',
            sid: 'sid-1',
            jti: 'refresh-jti',
            typ: 'refresh',
        });
        vi.spyOn(service as any, 'acquireRefreshLock' as any).mockResolvedValue(false);

        await service
            .refreshToken({ refreshToken: 'refresh-token' })
            .catch((error) => expect(extractRpcCode(error)).toBe(GrpcStatus.ABORTED));
    });

    it('getUserPermissions returns fallback permission when redis key missing', async () => {
        const service = createAuthService();
        vi.spyOn(service as any, 'getSession').mockResolvedValue({
            userId: 'user-1',
            sid: 'sid-1',
            accessJtiHash: 'hash',
            jtiHash: 'refresh-hash',
            refreshExpiresAt: Date.now(),
        });

        await expect(service.getUserPermissions({ userId: 'user-1', sid: 'sid-1' })).resolves.toEqual({
            permissions: ['user:read'],
        });
    });

    it('getUserPermissions rejects when sid mismatches', async () => {
        const service = createAuthService();
        vi.spyOn(service as any, 'getSession').mockResolvedValue({
            userId: 'user-1',
            sid: 'sid-a',
            accessJtiHash: 'hash',
            jtiHash: 'refresh-hash',
            refreshExpiresAt: Date.now(),
        });

        await service
            .getUserPermissions({ userId: 'user-1', sid: 'sid-b' })
            .catch((error) => expect(extractRpcCode(error)).toBe(GrpcStatus.UNAUTHENTICATED));
    });
});
