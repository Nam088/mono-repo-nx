import type { PermissionKey } from '../registry';

/**
 * Defines a single Role with its associated permissions.
 */
export interface RoleDef<N extends string> {
    readonly name: N;
    readonly description?: string;
    readonly permissions: ReadonlyArray<PermissionKey>;
}

/**
 * Helper to define a role with strict type inference for permission keys.
 *
 * @example
 * ```ts
 * import { defineRole } from './define-role';
 * import { P } from '../registry';
 *
 * export const adminRole = defineRole({
 *   name: 'ADMIN',
 *   permissions: [P.user.manage, P.auth.revoke]
 * });
 * ```
 */
export function defineRole<N extends string>(def: RoleDef<N>): RoleDef<N> {
    return {
        ...def,
        permissions: Array.from(new Set(def.permissions)),
    };
}
