import { describe, expect, it } from 'vitest';

import { buildRegistry } from './build-registry';
import { definePermissions } from './define-permissions';

describe('buildRegistry - validation', () => {
    it('throws when two definitions share the same resource', () => {
        const a = definePermissions({
            resource: 'user',
            actions: { read: { description: 'r' } },
        });
        const b = definePermissions({
            resource: 'user',
            actions: { write: { description: 'w' } },
        });

        expect(() => buildRegistry([a, b])).toThrow(/Duplicate resource/);
    });

    it('throws when a group declares an empty `includes`', () => {
        const def = definePermissions({
            resource: 'user',
            actions: {
                read: { description: 'r' },
                broken: { description: 'b', includes: [] as unknown as ['read'] },
            },
        });

        expect(() => buildRegistry([def])).toThrow(/at least one item/);
    });

    it('throws when an action implies a non-existent action', () => {
        const def = definePermissions({
            resource: 'user',
            actions: {
                read: { description: 'r' },
                update: {
                    description: 'u',
                    implies: ['ghost'] as unknown as ['read'],
                },
            },
        });

        expect(() => buildRegistry([def])).toThrow(/non-existent/);
    });

    it('throws when an action implies a group', () => {
        const def = definePermissions({
            resource: 'user',
            actions: {
                read: { description: 'r' },
                manage: { description: 'm', includes: ['read'] },
                bad: {
                    description: 'b',
                    implies: ['manage'],
                },
            },
        });

        expect(() => buildRegistry([def])).toThrow(/cannot imply group/);
    });

    it('throws when a group includes another group', () => {
        const def = definePermissions({
            resource: 'user',
            actions: {
                read: { description: 'r' },
                manage: { description: 'm', includes: ['read'] },
                meta: {
                    description: 'super',
                    includes: ['manage'],
                },
            },
        });

        expect(() => buildRegistry([def])).toThrow(/cannot include another group/);
    });

    it('throws when implies form a cycle', () => {
        const def = definePermissions({
            resource: 'user',
            actions: {
                a: { description: 'a', implies: ['b'] },
                b: { description: 'b', implies: ['c'] },
                c: { description: 'c', implies: ['a'] },
            },
        });

        expect(() => buildRegistry([def])).toThrow(/Cycle detected/);
    });
});

describe('buildRegistry - structure', () => {
    const def = definePermissions({
        resource: 'user',
        actions: {
            read: { description: 'View user' },
            create: { description: 'Create user' },
            update: { description: 'Update user', implies: ['read'] },
            delete: { description: 'Delete user', implies: ['read'] },
            manage: {
                description: 'Full management',
                includes: ['read', 'create', 'update', 'delete'],
            },
        },
    });
    const reg = buildRegistry([def]);

    it('exposes ordered keys, action keys and group keys', () => {
        expect(reg.keys).toEqual(['user:read', 'user:create', 'user:update', 'user:delete', 'user:manage']);
        expect(reg.actionKeys).toEqual(['user:read', 'user:create', 'user:update', 'user:delete']);
        expect(reg.groupKeys).toEqual(['user:manage']);
        expect(reg.resources).toEqual(['user']);
    });

    it('exposes `byResource` flat (actions and groups, preserving declaration order)', () => {
        expect(reg.byResource).toEqual({
            user: ['read', 'create', 'update', 'delete', 'manage'],
        });
    });

    it('exposes `refs` namespace mapping name -> full key', () => {
        expect(reg.refs).toEqual({
            user: {
                read: 'user:read',
                create: 'user:create',
                update: 'user:update',
                delete: 'user:delete',
                manage: 'user:manage',
            },
        });
    });

    it('freezes refs and per-resource maps so they cannot be mutated', () => {
        expect(Object.isFrozen(reg.refs)).toBe(true);
        expect(Object.isFrozen(reg.refs.user)).toBe(true);
        expect(Object.isFrozen(reg.byResource)).toBe(true);
        expect(Object.isFrozen(reg.byResource.user)).toBe(true);
    });

    it('classifies keys as action or group', () => {
        expect(reg.has('user:read')).toBe(true);
        expect(reg.has('user:manage')).toBe(true);
        expect(reg.has('user:nope')).toBe(false);
        expect(reg.isAction('user:read')).toBe(true);
        expect(reg.isAction('user:manage')).toBe(false);
        expect(reg.isGroup('user:manage')).toBe(true);
        expect(reg.isGroup('user:read')).toBe(false);
    });
});

describe('buildRegistry - expand & covers', () => {
    const def = definePermissions({
        resource: 'user',
        actions: {
            read: { description: 'r' },
            create: { description: 'c' },
            update: { description: 'u', implies: ['read'] },
            delete: { description: 'd', implies: ['read'] },
            manage: {
                description: 'm',
                includes: ['read', 'create', 'update', 'delete'],
            },
        },
    });
    const reg = buildRegistry([def]);

    it('expands an atomic action to itself only', () => {
        expect([...reg.expand('user:read')]).toEqual(['user:read']);
    });

    it('expands an action with implies to include all transitive entailments', () => {
        expect(new Set(reg.expand('user:update'))).toEqual(new Set(['user:update', 'user:read']));
    });

    it('expands a group to the underlying actions plus their implies closure', () => {
        expect(new Set(reg.expand('user:manage'))).toEqual(
            new Set(['user:read', 'user:create', 'user:update', 'user:delete']),
        );
    });

    it('covers true when a single action grant entails the required action', () => {
        expect(reg.covers(['user:update'], 'user:read')).toBe(true);
    });

    it('covers true when a group grant entails an action requirement', () => {
        expect(reg.covers(['user:manage'], 'user:create')).toBe(true);
    });

    it('covers true when a set of action grants entails a group requirement', () => {
        expect(reg.covers(['user:read', 'user:create', 'user:update', 'user:delete'], 'user:manage')).toBe(true);
    });

    it('covers false when grants do not entail the required permission', () => {
        expect(reg.covers(['user:read'], 'user:create')).toBe(false);
        expect(reg.covers(['user:create', 'user:read'], 'user:manage')).toBe(false);
    });

    it('covers false for unknown required key', () => {
        expect(reg.covers(['user:manage'], 'user:nope' as never)).toBe(false);
    });
});

describe('buildRegistry - list catalog', () => {
    const def = definePermissions({
        resource: 'user',
        actions: {
            read: { description: 'View user' },
            update: { description: 'Update user', implies: ['read'] },
            manage: { description: 'Full management', includes: ['read', 'update'] },
        },
    });
    const reg = buildRegistry([def]);

    it('returns one entry per key with kind, description and expansion', () => {
        const items = reg.list();

        expect(items).toHaveLength(3);

        const read = items.find((i) => i.key === 'user:read');
        expect(read).toMatchObject({
            key: 'user:read',
            resource: 'user',
            name: 'read',
            kind: 'action',
            description: 'View user',
        });
        expect(new Set(read?.expandsTo ?? [])).toEqual(new Set(['user:read']));

        const update = items.find((i) => i.key === 'user:update');
        expect(update?.kind).toBe('action');
        expect(new Set(update?.expandsTo ?? [])).toEqual(new Set(['user:update', 'user:read']));

        const manage = items.find((i) => i.key === 'user:manage');
        expect(manage?.kind).toBe('group');
        expect(new Set(manage?.expandsTo ?? [])).toEqual(new Set(['user:read', 'user:update']));
    });
});
