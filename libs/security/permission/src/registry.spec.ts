import { describe, expect, it } from 'vitest';

import { P, PERMISSIONS } from './registry';

describe('central permission registry', () => {
    it('exposes the auth and user resources', () => {
        expect(new Set(PERMISSIONS.resources)).toEqual(new Set(['auth', 'user']));
    });

    it('contains all expected keys', () => {
        expect(new Set(PERMISSIONS.keys)).toEqual(
            new Set([
                'auth:login',
                'auth:refresh',
                'auth:revoke',
                'auth:register',
                'user:read',
                'user:create',
                'user:update',
                'user:delete',
                'user:manage',
            ]),
        );
    });

    it('makes `P.<resource>.<name>` resolve to the full key string', () => {
        expect(P.user.create).toBe('user:create');
        expect(P.user.manage).toBe('user:manage');
        expect(P.auth.login).toBe('auth:login');
    });

    it('treats `update` as implying `read` and `manage` as covering CRUD', () => {
        expect(PERMISSIONS.covers([P.user.update], P.user.read)).toBe(true);
        expect(PERMISSIONS.covers([P.user.manage], P.user.delete)).toBe(true);
        expect(PERMISSIONS.covers([P.user.read], P.user.create)).toBe(false);
    });
});
