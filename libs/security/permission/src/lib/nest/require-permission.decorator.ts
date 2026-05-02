import { applyDecorators, SetMetadata } from '@nestjs/common';

import type { PermissionKey } from '../../registry';
import { PERMISSION_METADATA_KEY } from './permission.constants';

/**
 * Spec object used to express OR semantics on a handler.
 *
 * `@RequirePermission({ any: [P.user.read, P.user.update] })` passes if the
 * caller is granted at least one of the listed keys (after expansion).
 */
export interface PermissionAnySpec {
    readonly any: readonly PermissionKey[];
}

/**
 * Compiled requirement attached to a handler/class by `@RequirePermission(...)`.
 *
 * - `mode === 'all'`: every key must be covered by the caller's grants.
 * - `mode === 'any'`: at least one key must be covered.
 */
export type PermissionRequirement =
    | { readonly mode: 'all'; readonly keys: readonly PermissionKey[] }
    | { readonly mode: 'any'; readonly keys: readonly PermissionKey[] };

function isAnySpec(input: unknown): input is PermissionAnySpec {
    return typeof input === 'object' && input !== null && Array.isArray((input as PermissionAnySpec).any);
}

/**
 * Declare permission requirements for a controller class or handler.
 *
 * Default semantics is AND: every listed key must be covered by the caller's grants.
 * Pass an `{ any: [...] }` object to opt into OR semantics.
 *
 * @example
 *   ```ts
 *   @RequirePermission(P.user.read)                              // single
 *   @RequirePermission(P.user.read, P.user.update)               // AND
 *   @RequirePermission({ any: [P.user.read, P.user.update] })    // OR
 *   ```
 */
export function RequirePermission(spec: PermissionAnySpec): MethodDecorator & ClassDecorator;
export function RequirePermission(
    key: PermissionKey,
    ...rest: readonly PermissionKey[]
): MethodDecorator & ClassDecorator;
export function RequirePermission(
    first: PermissionKey | PermissionAnySpec,
    ...rest: readonly PermissionKey[]
): MethodDecorator & ClassDecorator {
    if (isAnySpec(first)) {
        if (first.any.length === 0) {
            throw new Error('@RequirePermission({ any: [] }) must declare at least one key.');
        }
        const requirement: PermissionRequirement = { mode: 'any', keys: [...first.any] };
        return applyDecorators(SetMetadata(PERMISSION_METADATA_KEY, requirement));
    }

    const keys: readonly PermissionKey[] = [first, ...rest];
    const requirement: PermissionRequirement = { mode: 'all', keys };
    return applyDecorators(SetMetadata(PERMISSION_METADATA_KEY, requirement));
}
