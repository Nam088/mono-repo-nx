import type Redis from 'ioredis';
import { describe, expect, it, vi } from 'vitest';

import { type RedisPermissionsKeyBuilder, RedisPermissionsResolver } from './redis-permissions-resolver';

function makeRedisStub(getImpl: (key: string) => Promise<string | null>): Redis {
    return { get: vi.fn(getImpl) } as unknown as Redis;
}

const buildKey: RedisPermissionsKeyBuilder = ({ sub }) => `auth:perms:user:${sub}`;

const ctx = (sub: string) => ({ request: {}, user: { sub } });

describe('RedisPermissionsResolver', () => {
    it('returns [] when the key is missing', async () => {
        const redis = makeRedisStub(async () => null);
        const resolver = new RedisPermissionsResolver(redis, buildKey);

        await expect(resolver.resolve(ctx('u1'))).resolves.toEqual([]);
    });

    it('parses a JSON string array stored at the configured key', async () => {
        const redis = makeRedisStub(async (key) => {
            expect(key).toBe('auth:perms:user:u1');
            return JSON.stringify(['user:read', 'user:update']);
        });
        const resolver = new RedisPermissionsResolver(redis, buildKey);

        await expect(resolver.resolve(ctx('u1'))).resolves.toEqual(['user:read', 'user:update']);
    });

    it('returns [] when the payload is not valid JSON', async () => {
        const redis = makeRedisStub(async () => 'not-json');
        const resolver = new RedisPermissionsResolver(redis, buildKey);

        await expect(resolver.resolve(ctx('u1'))).resolves.toEqual([]);
    });

    it('returns [] when the JSON value is not an array', async () => {
        const redis = makeRedisStub(async () => JSON.stringify({ user: 'read' }));
        const resolver = new RedisPermissionsResolver(redis, buildKey);

        await expect(resolver.resolve(ctx('u1'))).resolves.toEqual([]);
    });

    it('filters out non-string entries from the array', async () => {
        const redis = makeRedisStub(async () => JSON.stringify(['user:read', 42, null, 'user:update']));
        const resolver = new RedisPermissionsResolver(redis, buildKey);

        await expect(resolver.resolve(ctx('u1'))).resolves.toEqual(['user:read', 'user:update']);
    });

    it('uses the injected key builder verbatim', async () => {
        const customBuilder: RedisPermissionsKeyBuilder = ({ sub }) => `tenant:1:perms:${sub}`;
        const calls: string[] = [];
        const redis = makeRedisStub(async (key) => {
            calls.push(key);
            return null;
        });
        const resolver = new RedisPermissionsResolver(redis, customBuilder);

        await resolver.resolve(ctx('u-7'));

        expect(calls).toEqual(['tenant:1:perms:u-7']);
    });
});
