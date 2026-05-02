import type { PermissionDef, PermissionDefinition } from './types';

/**
 * Declares permissions for one resource (typically in a per-domain file).
 *
 * This is an identity helper: it simply returns the input object.
 * The value comes from TypeScript inferring literal types from:
 * - `R` (resource name)
 * - action key union from `Actions`
 *
 * The self-referential `Actions` constraint ensures:
 * - `implies` only accepts action names from the same resource (compile-time)
 * - `includes` only accepts names from the same map (compile-time)
 *
 * Runtime validation (group-to-group references, cycles, etc.) happens in `buildRegistry`.
 *
 * @example
 * ```ts
 * export const userPermissions = definePermissions({
 *     resource: 'user',
 *     description: 'Permissions for user management domain.',
 *     actions: {
 *         read: { description: 'View user' },
 *         update: { description: 'Update user', implies: ['read'] },
 *         manage: { description: 'Full management', includes: ['read', 'update'] },
 *     },
 * });
 * ```
 */
export function definePermissions<
    const R extends string,
    const Actions extends Record<string, PermissionDef<Extract<keyof Actions, string>>>,
>(def: {
    readonly resource: R;
    readonly description?: string;
    readonly actions: Actions;
}): PermissionDefinition<R, Extract<keyof Actions, string>> {
    return def as unknown as PermissionDefinition<R, Extract<keyof Actions, string>>;
}
