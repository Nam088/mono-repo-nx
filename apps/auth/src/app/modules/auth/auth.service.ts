import { createHash, randomUUID } from 'node:crypto';

import { status as GrpcStatus } from '@grpc/grpc-js';
import { EntityManager } from '@mikro-orm/postgresql';
import { AppConfigService } from '@nam088/config';
import { IdempotencyKeyEntity, OutboxEventEntity, UserEntity } from '@nam088/postgresql';
import { RedisService } from '@nam088/redis';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';

type RegisterPayload = {
    email: string;
    name: string;
    password: string;
    idempotencyKey?: string;
};

type LoginPayload = {
    email: string;
    password: string;
};

type RefreshTokenPayload = {
    refreshToken: string;
};

type ValidateAccessTokenPayload = {
    accessToken: string;
};

type LogoutPayload = {
    userId: string;
};

type TokenPair = {
    accessToken: string;
    refreshToken: string;
    accessJti: string;
    jti: string;
    sid: string;
    refreshExpiresAt: number;
    accessExpiresAt: number;
};

type RefreshClaims = {
    sub: string;
    sid: string;
    jti: string;
    typ: 'refresh';
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string | string[];
};

type AccessClaims = {
    sub: string;
    sid: string;
    jti: string;
    email?: string;
    typ: 'access';
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string | string[];
};

@Injectable()
export class AuthService {
    private static readonly LOGIN_RATE_LIMIT = { max: 10, windowSeconds: 60 };
    private static readonly REFRESH_RATE_LIMIT = { max: 20, windowSeconds: 60 };
    private static readonly VALIDATE_RATE_LIMIT = { max: 120, windowSeconds: 60 };

    constructor(
        private readonly em: EntityManager,
        private readonly jwtService: JwtService,
        private readonly appConfigService: AppConfigService,
        private readonly redisService: RedisService,
    ) {}

    async register(
        payload: RegisterPayload,
    ): Promise<{ userId: string; email: string; name: string; created: boolean }> {
        const normalizedEmail = payload.email.trim().toLowerCase();
        const normalizedName = payload.name.trim();
        const requestHash = this.hashRequest({
            email: normalizedEmail,
            name: normalizedName,
            password: payload.password,
        });

        const em = this.em.fork();
        return em.transactional(async (tx) => {
            const existingIdempotency = await this.claimOrLoadIdempotency(
                tx,
                payload.idempotencyKey,
                'auth.register',
                requestHash,
            );
            if (existingIdempotency?.responseBody) {
                return existingIdempotency.responseBody as {
                    userId: string;
                    email: string;
                    name: string;
                    created: boolean;
                };
            }

            const existingUser = await tx.findOne(UserEntity, { email: normalizedEmail });
            if (existingUser) {
                throw new RpcException({ code: GrpcStatus.ALREADY_EXISTS, message: 'Email already exists' });
            }

            const user = tx.create(UserEntity, {
                email: normalizedEmail,
                name: normalizedName,
                passwordHash: await this.hashPassword(payload.password),
            });
            tx.persist(user);

            const response = {
                userId: user.id,
                email: user.email,
                name: user.name,
                created: true,
            };
            this.enqueueOutbox(tx, 'User', user.id, 'UserRegistered', {
                userId: user.id,
                email: user.email,
                name: user.name,
            });

            await this.markIdempotencyCompleted(
                tx,
                payload.idempotencyKey,
                'auth.register',
                requestHash,
                response,
                200,
            );
            await tx.flush();
            return response;
        });
    }

    async login(payload: LoginPayload): Promise<{ userId: string; accessToken: string; refreshToken: string }> {
        const normalizedEmail = payload.email.trim().toLowerCase();
        await this.enforceRateLimit(
            `auth:ratelimit:login:${this.hashString(normalizedEmail)}`,
            AuthService.LOGIN_RATE_LIMIT.max,
            AuthService.LOGIN_RATE_LIMIT.windowSeconds,
            'login_rate_limited',
        );

        const em = this.em.fork();
        return em.transactional(async (tx) => {
            const user = await tx.findOne(UserEntity, { email: normalizedEmail });
            if (!user || !(await this.verifyPassword(payload.password, user.passwordHash))) {
                throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'Invalid credentials' });
            }

            const tokenPair = await this.issueTokenPair(user.id, user.email);
            await this.saveSession(user.id, tokenPair);

            const response = {
                userId: user.id,
                accessToken: tokenPair.accessToken,
                refreshToken: tokenPair.refreshToken,
            };
            this.enqueueOutbox(tx, 'User', user.id, 'UserLoggedIn', {
                userId: user.id,
                email: user.email,
            });

            await tx.flush();
            return response;
        });
    }

    async refreshToken(
        payload: RefreshTokenPayload,
    ): Promise<{ userId: string; accessToken: string; refreshToken: string }> {
        await this.enforceRateLimit(
            `auth:ratelimit:refresh:${this.hashString(payload.refreshToken)}`,
            AuthService.REFRESH_RATE_LIMIT.max,
            AuthService.REFRESH_RATE_LIMIT.windowSeconds,
            'refresh_rate_limited',
        );
        const claims = await this.verifyRefreshToken(payload.refreshToken);
        const lockAcquired = await this.acquireRefreshLock(claims.sub);
        if (!lockAcquired) {
            throw new RpcException({ code: GrpcStatus.ABORTED, message: 'refresh_in_progress' });
        }

        try {
            const session = await this.getSession(claims.sub);
            if (!session || session.sid !== claims.sid || session.jtiHash !== this.hashString(claims.jti)) {
                throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'refresh_invalid' });
            }

            const user = await this.em.fork().findOne(UserEntity, { id: claims.sub });
            if (!user) {
                throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'refresh_invalid' });
            }

            const tokenPair = await this.issueTokenPair(user.id, user.email, session.sid);
            await this.saveSession(user.id, tokenPair);

            return {
                userId: user.id,
                accessToken: tokenPair.accessToken,
                refreshToken: tokenPair.refreshToken,
            };
        } finally {
            await this.releaseRefreshLock(claims.sub);
        }
    }

    async logout(payload: LogoutPayload): Promise<{ success: boolean }> {
        await this.redisService.getClient().del(this.buildSessionKey(payload.userId));
        return { success: true };
    }

    async validateAccessToken(
        payload: ValidateAccessTokenPayload,
    ): Promise<{ userId: string; email: string; sid: string }> {
        await this.enforceRateLimit(
            `auth:ratelimit:validate:${this.hashString(payload.accessToken)}`,
            AuthService.VALIDATE_RATE_LIMIT.max,
            AuthService.VALIDATE_RATE_LIMIT.windowSeconds,
            'validate_rate_limited',
        );
        const claims = await this.verifyAccessToken(payload.accessToken);
        const session = await this.getSession(claims.sub);
        if (!session || session.sid !== claims.sid || session.accessJtiHash !== this.hashString(claims.jti)) {
            throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'invalid_access_token' });
        }

        return {
            userId: claims.sub,
            email: claims.email ?? '',
            sid: claims.sid,
        };
    }

    private async claimOrLoadIdempotency(
        em: EntityManager,
        idempotencyKey: string | undefined,
        operation: string,
        requestHash: string,
    ): Promise<IdempotencyKeyEntity | null> {
        if (!idempotencyKey) {
            return null;
        }

        const record = await em.findOne(IdempotencyKeyEntity, {
            idempotencyKey,
            operation,
        });
        if (!record) {
            em.persist(
                em.create(IdempotencyKeyEntity, {
                    idempotencyKey,
                    operation,
                    requestHash,
                    status: 'processing',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }),
            );
            return null;
        }

        if (record.requestHash !== requestHash) {
            throw new RpcException({
                code: GrpcStatus.FAILED_PRECONDITION,
                message: 'Idempotency key payload mismatch',
            });
        }

        if (record.status === 'completed') {
            return record;
        }

        throw new RpcException({ code: GrpcStatus.ABORTED, message: 'Idempotency key is still processing' });
    }

    private async markIdempotencyCompleted(
        em: EntityManager,
        idempotencyKey: string | undefined,
        operation: string,
        requestHash: string,
        responseBody: Record<string, unknown>,
        responseCode: number,
    ): Promise<void> {
        if (!idempotencyKey) {
            return;
        }

        const record = await em.findOneOrFail(IdempotencyKeyEntity, {
            idempotencyKey,
            operation,
        });

        record.status = 'completed';
        record.responseCode = responseCode;
        record.responseBody = responseBody;
        record.completedAt = new Date();
    }

    private enqueueOutbox(
        em: EntityManager,
        aggregateType: string,
        aggregateId: string,
        eventType: string,
        payload: Record<string, unknown>,
    ): void {
        em.persist(
            em.create(OutboxEventEntity, {
                aggregateType,
                aggregateId,
                eventType,
                payload,
                status: 'pending',
                retryCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
        );
    }

    private hashRequest(payload: Record<string, unknown>): string {
        return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    }

    private async hashPassword(rawPassword: string): Promise<string> {
        return argon2.hash(rawPassword);
    }

    private async verifyPassword(rawPassword: string, passwordHash: string): Promise<boolean> {
        try {
            return await argon2.verify(passwordHash, rawPassword);
        } catch {
            return false;
        }
    }

    private async issueTokenPair(userId: string, email: string, sid?: string): Promise<TokenPair> {
        const jwtConfig = this.appConfigService.getJwtConfig();
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const sessionId = sid ?? randomUUID();
        const accessJti = randomUUID();
        const jti = randomUUID();
        const accessExpiresAt = nowInSeconds + jwtConfig.JWT_ACCESS_TTL_SECONDS;
        const refreshExpiresAt = nowInSeconds + jwtConfig.JWT_REFRESH_TTL_SECONDS;

        const header = { alg: 'HS256', kid: jwtConfig.JWT_ACTIVE_KID, typ: 'JWT' } as const;
        const accessToken = await this.jwtService.signAsync(
            {
                sub: userId,
                email,
                sid: sessionId,
                jti: accessJti,
                typ: 'access',
            },
            {
                secret: jwtConfig.JWT_ACCESS_SECRET,
                algorithm: 'HS256',
                issuer: jwtConfig.JWT_ISSUER,
                audience: jwtConfig.JWT_AUDIENCE,
                expiresIn: jwtConfig.JWT_ACCESS_TTL_SECONDS,
                header,
            },
        );
        const refreshToken = await this.jwtService.signAsync(
            {
                sub: userId,
                sid: sessionId,
                jti,
                typ: 'refresh',
            },
            {
                secret: jwtConfig.JWT_REFRESH_SECRET,
                algorithm: 'HS256',
                issuer: jwtConfig.JWT_ISSUER,
                audience: jwtConfig.JWT_AUDIENCE,
                expiresIn: jwtConfig.JWT_REFRESH_TTL_SECONDS,
                header,
            },
        );

        return {
            accessToken,
            refreshToken,
            accessJti,
            jti,
            sid: sessionId,
            refreshExpiresAt,
            accessExpiresAt,
        };
    }

    private async verifyRefreshToken(refreshToken: string): Promise<RefreshClaims> {
        const jwtConfig = this.appConfigService.getJwtConfig();
        try {
            const claims = await this.jwtService.verifyAsync<RefreshClaims>(refreshToken, {
                secret: jwtConfig.JWT_REFRESH_SECRET,
                algorithms: ['HS256'],
                issuer: jwtConfig.JWT_ISSUER,
                audience: jwtConfig.JWT_AUDIENCE,
            });
            if (claims.typ !== 'refresh' || !claims.sub || !claims.sid || !claims.jti) {
                throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'refresh_invalid' });
            }
            return claims;
        } catch {
            throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'refresh_invalid' });
        }
    }

    private async verifyAccessToken(accessToken: string): Promise<AccessClaims> {
        const jwtConfig = this.appConfigService.getJwtConfig();
        try {
            const claims = await this.jwtService.verifyAsync<AccessClaims>(accessToken, {
                secret: jwtConfig.JWT_ACCESS_SECRET,
                algorithms: ['HS256'],
                issuer: jwtConfig.JWT_ISSUER,
                audience: jwtConfig.JWT_AUDIENCE,
            });
            if (claims.typ !== 'access' || !claims.sub || !claims.sid) {
                throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'invalid_access_token' });
            }
            if (!claims.jti) {
                throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'invalid_access_token' });
            }
            return claims;
        } catch {
            throw new RpcException({ code: GrpcStatus.UNAUTHENTICATED, message: 'invalid_access_token' });
        }
    }

    private async saveSession(userId: string, tokenPair: TokenPair): Promise<void> {
        const ttlInSeconds = Math.max(1, tokenPair.refreshExpiresAt - Math.floor(Date.now() / 1000));
        await this.redisService.getClient().set(
            this.buildSessionKey(userId),
            JSON.stringify({
                userId,
                sid: tokenPair.sid,
                accessJtiHash: this.hashString(tokenPair.accessJti),
                jtiHash: this.hashString(tokenPair.jti),
                refreshExpiresAt: tokenPair.refreshExpiresAt,
                accessExpiresAt: tokenPair.accessExpiresAt,
                updatedAt: Date.now(),
            }),
            'EX',
            ttlInSeconds,
        );
    }

    private async getSession(userId: string): Promise<{
        userId: string;
        sid: string;
        accessJtiHash: string;
        jtiHash: string;
        refreshExpiresAt: number;
    } | null> {
        const rawSession = await this.redisService.getClient().get(this.buildSessionKey(userId));
        if (!rawSession) {
            return null;
        }
        try {
            const parsed = JSON.parse(rawSession) as {
                userId: string;
                sid: string;
                accessJtiHash: string;
                jtiHash: string;
                refreshExpiresAt: number;
            };
            return parsed;
        } catch {
            return null;
        }
    }

    private async acquireRefreshLock(userId: string): Promise<boolean> {
        const lockResult = await this.redisService
            .getClient()
            .set(this.buildRefreshLockKey(userId), randomUUID(), 'EX', 5, 'NX');
        return lockResult === 'OK';
    }

    private async releaseRefreshLock(userId: string): Promise<void> {
        await this.redisService.getClient().del(this.buildRefreshLockKey(userId));
    }

    private buildSessionKey(userId: string): string {
        return `auth:session:user:${userId}`;
    }

    private buildRefreshLockKey(userId: string): string {
        return `auth:refresh:lock:${userId}`;
    }

    private hashString(value: string): string {
        return createHash('sha256').update(value).digest('hex');
    }

    private async enforceRateLimit(
        key: string,
        maxRequests: number,
        windowSeconds: number,
        message: string,
    ): Promise<void> {
        const client = this.redisService.getClient();
        const current = await client.incr(key);
        if (current === 1) {
            await client.expire(key, windowSeconds);
        }
        if (current > maxRequests) {
            throw new RpcException({ code: GrpcStatus.RESOURCE_EXHAUSTED, message });
        }
    }
}
