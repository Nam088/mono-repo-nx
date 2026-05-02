/**
 * Reflect metadata key under which `@RequirePermission` stores its `PermissionRequirement`.
 *
 * Read by `PermissionGuard` via `Reflector.getAllAndOverride`.
 */
export const PERMISSION_METADATA_KEY = Symbol('@nam088/permission:requirement');

/**
 * Nest DI token for the `PermissionsResolver` that the guard delegates to.
 *
 * Bound by `PermissionModule.forRoot({ resolver })`.
 */
export const PERMISSIONS_RESOLVER = Symbol('@nam088/permission:resolver');
