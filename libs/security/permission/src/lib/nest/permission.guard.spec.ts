import 'reflect-metadata';

import { type ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { P } from '../../registry';
import { PERMISSION_METADATA_KEY } from './permission.constants';
import { PermissionGuard } from './permission.guard';
import type { PermissionsResolver } from './permissions-resolver.interface';
import type { PermissionRequirement } from './require-permission.decorator';

function makeContext(metadata: PermissionRequirement | undefined, request: unknown): ExecutionContext {
    const handler = function handler() {
        return null;
    };
    const targetClass = class {};

    if (metadata) {
        Reflect.defineMetadata(PERMISSION_METADATA_KEY, metadata, handler);
    }

    return {
        getHandler: () => handler,
        getClass: () => targetClass,
        switchToHttp: () => ({
            getRequest: <T>() => request as T,
            getResponse: vi.fn(),
            getNext: vi.fn(),
        }),
        switchToRpc: vi.fn(),
        switchToWs: vi.fn(),
        getArgs: vi.fn(),
        getArgByIndex: vi.fn(),
        getType: vi.fn(),
    } as unknown as ExecutionContext;
}

function makeResolver(grants: readonly string[]): PermissionsResolver {
    return { resolve: vi.fn().mockResolvedValue(grants) };
}

describe('PermissionGuard', () => {
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
    });

    it('passes through when no metadata is present', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([]));
        const ctx = makeContext(undefined, { user: { sub: 'u1' } });

        await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('throws Unauthorized when no authenticated user is on the request', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([P.user.read]));
        const ctx = makeContext({ mode: 'all', keys: [P.user.read] }, {});

        await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws Unauthorized when user.sub is missing or not a string', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([P.user.read]));
        const ctx = makeContext({ mode: 'all', keys: [P.user.read] }, { user: { sub: '' } });

        await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('AND mode: allows when every required key is covered', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([P.user.update, P.user.create]));
        const ctx = makeContext({ mode: 'all', keys: [P.user.read, P.user.create] }, { user: { sub: 'u1' } });

        await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('AND mode: forbids when at least one required key is not covered', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([P.user.read]));
        const ctx = makeContext({ mode: 'all', keys: [P.user.read, P.user.create] }, { user: { sub: 'u1' } });

        await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('ANY mode: allows when at least one required key is covered', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([P.user.read]));
        const ctx = makeContext({ mode: 'any', keys: [P.user.read, P.user.create] }, { user: { sub: 'u1' } });

        await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('ANY mode: forbids when none of the required keys are covered', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([]));
        const ctx = makeContext({ mode: 'any', keys: [P.user.read, P.user.create] }, { user: { sub: 'u1' } });

        await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('honours grouping: granting a group covers any contained action', async () => {
        const guard = new PermissionGuard(reflector, makeResolver([P.user.manage]));
        const ctx = makeContext(
            { mode: 'all', keys: [P.user.read, P.user.create, P.user.update, P.user.delete] },
            { user: { sub: 'u1' } },
        );

        await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('passes the request and user to the resolver', async () => {
        const resolver = makeResolver([P.user.read]);
        const guard = new PermissionGuard(reflector, resolver);
        const request = { user: { sub: 'user-42', email: 'a@b.com' } };
        const ctx = makeContext({ mode: 'all', keys: [P.user.read] }, request);

        await guard.canActivate(ctx);

        expect(resolver.resolve).toHaveBeenCalledWith({
            request,
            user: request.user,
        });
    });

    it('prefers authorize() when resolver provides remote decision', async () => {
        const resolver: PermissionsResolver = {
            resolve: vi.fn().mockResolvedValue([]),
            authorize: vi.fn().mockResolvedValue(true),
        };
        const guard = new PermissionGuard(reflector, resolver);
        const request = { user: { sub: 'user-42' } };
        const requirement: PermissionRequirement = { mode: 'all', keys: [P.user.read] };
        const ctx = makeContext(requirement, request);

        await expect(guard.canActivate(ctx)).resolves.toBe(true);
        expect(resolver.authorize).toHaveBeenCalledWith({
            request,
            user: request.user,
            requirement,
        });
        expect(resolver.resolve).not.toHaveBeenCalled();
    });

    it('throws clear error when resolver has neither authorize nor resolve', async () => {
        const resolver: PermissionsResolver = {};
        const guard = new PermissionGuard(reflector, resolver);
        const ctx = makeContext({ mode: 'all', keys: [P.user.read] }, { user: { sub: 'u1' } });

        await expect(guard.canActivate(ctx)).rejects.toThrow(/must implement `authorize` or `resolve`/);
    });
});
