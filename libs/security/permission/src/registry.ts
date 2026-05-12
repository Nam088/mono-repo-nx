import { authPermissions } from './domains/auth.permissions';
import { userPermissions } from './domains/user.permissions';
import { buildRegistry } from './lib/build-registry';
import { P as generatedP } from './refs.generated';

/**
 * Central permission registry.
 * Use `PERMISSIONS.has`, `expand`, `covers`, `list`, etc.
 */
export const PERMISSIONS = buildRegistry([authPermissions, userPermissions] as const);

/**
 * Short alias for generated typed references.
 * Use `P.user.create` instead of `'user:create'`.
 *
 * - Full IDE autocomplete for resources and keys
 * - Hover shows literal type and generated JSDoc description
 * - Compile-time guarantee: generated refs must match the registry shape
 */
export const P = generatedP satisfies typeof PERMISSIONS.refs;

/**
 * Compile-time literal type for a permission key (action or group).
 */
export type PermissionKey = (typeof PERMISSIONS.keys)[number];

/**
 * Compile-time literal type for declared resource names.
 */
export type ResourceName = (typeof PERMISSIONS.resources)[number];

/**
 * Utility to get all permission keys.
 * If a resource is provided, returns keys for that resource only.
 */
export function allP(): ReadonlyArray<PermissionKey>;
export function allP<R extends ResourceName>(resource: R): ReadonlyArray<Extract<PermissionKey, `${R}:${string}`>>;
export function allP<R extends ResourceName>(resource?: R): ReadonlyArray<PermissionKey> {
    if (resource) {
        return PERMISSIONS.getKeysByResource(resource) as ReadonlyArray<Extract<PermissionKey, `${R}:${string}`>>;
    }
    return PERMISSIONS.keys;
}
