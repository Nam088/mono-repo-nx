export { definePermissions } from './lib/define-permissions';
export { PERMISSION_METADATA_KEY, PERMISSIONS_RESOLVER } from './lib/nest/permission.constants';
export { PermissionGuard } from './lib/nest/permission.guard';
export type { PermissionModuleOptions, PermissionsResolverConfig } from './lib/nest/permission.module';
export { PermissionModule } from './lib/nest/permission.module';
export type {
    PermissionsAuthorizeContext,
    PermissionsResolveContext,
    PermissionsResolver,
} from './lib/nest/permissions-resolver.interface';
export type { RedisPermissionsKeyBuilder } from './lib/nest/redis-permissions-resolver';
export { REDIS_PERMISSIONS_KEY_BUILDER, RedisPermissionsResolver } from './lib/nest/redis-permissions-resolver';
export type { PermissionAnySpec, PermissionRequirement } from './lib/nest/require-permission.decorator';
export { RequirePermission } from './lib/nest/require-permission.decorator';
export type { PermissionKey, ResourceName } from './registry';
export { P, PERMISSIONS } from './registry';
