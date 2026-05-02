import 'reflect-metadata';

import { describe, expect, it } from 'vitest';

import { P } from '../../registry';
import { PERMISSION_METADATA_KEY } from './permission.constants';
import { type PermissionRequirement, RequirePermission } from './require-permission.decorator';

function readMeta(target: object): PermissionRequirement | undefined {
    return Reflect.getMetadata(PERMISSION_METADATA_KEY, target) as PermissionRequirement | undefined;
}

describe('@RequirePermission', () => {
    it('stamps AND-mode metadata for a single key', () => {
        class Target {
            @RequirePermission(P.user.read)
            handler() {
                return null;
            }
        }

        const meta = readMeta(Target.prototype.handler as object);
        expect(meta).toEqual({ mode: 'all', keys: ['user:read'] });
    });

    it('stamps AND-mode metadata for multiple keys (varargs)', () => {
        class Target {
            @RequirePermission(P.user.read, P.user.update)
            handler() {
                return null;
            }
        }

        const meta = readMeta(Target.prototype.handler as object);
        expect(meta).toEqual({ mode: 'all', keys: ['user:read', 'user:update'] });
    });

    it('stamps ANY-mode metadata when given an `{ any }` spec', () => {
        class Target {
            @RequirePermission({ any: [P.user.read, P.user.update] })
            handler() {
                return null;
            }
        }

        const meta = readMeta(Target.prototype.handler as object);
        expect(meta).toEqual({ mode: 'any', keys: ['user:read', 'user:update'] });
    });

    it('attaches metadata to the class when used as a class decorator', () => {
        @RequirePermission(P.user.manage)
        class Target {}

        const meta = readMeta(Target);
        expect(meta).toEqual({ mode: 'all', keys: ['user:manage'] });
    });

    it('throws when an `any` spec is empty', () => {
        expect(() => RequirePermission({ any: [] as unknown as readonly [typeof P.user.read] })).toThrow(
            /at least one key/,
        );
    });
});
