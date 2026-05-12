import { PermissionKey } from '../registry';

/**
 * Logic to detect duplicates and return a clear error message as a string literal.
 */
type CheckDuplicates<T extends ReadonlyArray<unknown>, U extends ReadonlyArray<unknown> = []> = T extends readonly [
    infer L,
    ...infer R,
]
    ? L extends U[number]
        ? `ERROR: Duplicate permission found: ${L & string}`
        : CheckDuplicates<R, readonly [...U, L]>
    : T extends ReadonlyArray<infer E>
      ? Extract<U[number], E> extends never
          ? never
          : `ERROR: Potential duplicate detected between literal and spread: ${Extract<U[number], E> & string}`
      : never;

/**
 * Defines a single Role with its associated permissions.
 */
export interface RoleDef<N extends string> {
    readonly name: N;
    readonly description?: string;
    readonly permissions: ReadonlyArray<PermissionKey>;
}

/**
 * Helper to define a role with strict type inference and UNIQUE permission check at compile-time.
 */
export function defineRole<N extends string, const P extends ReadonlyArray<PermissionKey>>(def: {
    readonly name: N;
    readonly description?: string;
    readonly permissions: CheckDuplicates<P> extends never ? P : CheckDuplicates<P>;
}): RoleDef<N> {
    return {
        ...def,
        permissions: Array.from(new Set(def.permissions as ReadonlyArray<PermissionKey>)),
    };
}
