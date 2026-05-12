export { definePermissions } from './lib/define-permissions';
export type { RoleDef } from './lib/define-role';
export { defineRole } from './lib/define-role';
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

// ABAC Exports (Simplified)
export { type AppPolicyMap, Check, CheckPolicy, type PolicySpec } from './lib/nest/abac/check-policy.decorator';
export { PolicyGuard } from './lib/nest/abac/policy.guard';
export { PolicyModule } from './lib/nest/abac/policy.module';
export { PolicyRegistry } from './lib/nest/abac/policy.registry';
export { PolicyRule } from './lib/nest/abac/policy-rule.decorator';
export type { PolicyStrategy, PolicyUser } from './lib/nest/abac/resource-policy.base';
export { ResourcePolicy } from './lib/nest/abac/resource-policy.base';
export type { PermissionKey, ResourceName } from './registry';
export { allP, P, PERMISSIONS } from './registry';
export { adminRole } from './roles/admin.role';
export { superAdminRole } from './roles/super-admin.role';
export { userRole } from './roles/user.role';
