import { REDIS_CLIENT } from '@nam088/redis';
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import type { PermissionsResolveContext, PermissionsResolver } from './permissions-resolver.interface';

/**
 * DI token for the Redis key builder used by `RedisPermissionsResolver`.
 *
 * Bind it to a function that produces the Redis key under which a user's
 * granted permission keys are stored as a JSON `string[]`.
 */
export const REDIS_PERMISSIONS_KEY_BUILDER = Symbol('@nam088/permission:redis-key-builder');

/**
 * Builds the Redis key under which a user's granted permission keys are stored.
 *
 * The value at that key must be a JSON-encoded `string[]` of permission keys.
 */
export type RedisPermissionsKeyBuilder = (user: { sub: string }) => string;

/**
 * Default `PermissionsResolver` implementation backed by Redis.
 *
 * Reads the value at the key produced by the injected `RedisPermissionsKeyBuilder`
 * and parses it as a JSON `string[]`. The key shape is intentionally consumer-
 * controlled because permissions may live in a session blob or under a dedicated key.
 *
 * On a missing key or malformed payload, returns an empty list (deny by default
 * via the guard, which fails closed when no key covers the requirement).
 */
@Injectable()
export class RedisPermissionsResolver implements PermissionsResolver {
    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(REDIS_PERMISSIONS_KEY_BUILDER)
        private readonly buildKey: RedisPermissionsKeyBuilder,
    ) {}

    async resolve(ctx: PermissionsResolveContext): Promise<readonly string[]> {
        const key = this.buildKey({ sub: ctx.user.sub });
        const raw = await this.redis.get(key);
        if (!raw) {
            return [];
        }
        try {
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed.filter((v): v is string => typeof v === 'string');
        } catch {
            return [];
        }
    }
}
