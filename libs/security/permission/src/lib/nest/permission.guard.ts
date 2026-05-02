import {
    type CanActivate,
    type ExecutionContext,
    ForbiddenException,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { type PermissionKey, PERMISSIONS } from '../../registry';
import { PERMISSION_METADATA_KEY, PERMISSIONS_RESOLVER } from './permission.constants';
import type { PermissionsResolver } from './permissions-resolver.interface';
import type { PermissionRequirement } from './require-permission.decorator';

interface RequestWithUser {
    user?: { sub?: unknown } & Record<string, unknown>;
}

/**
 * Guard that enforces `@RequirePermission(...)` metadata on a handler/class.
 *
 * - No metadata -> allow (passthrough).
 * - Authenticated user is required; otherwise `UnauthorizedException('unauthenticated')`.
 * - `mode: 'all'` requires every key to be covered; `mode: 'any'` requires at least one.
 * - On miss -> `ForbiddenException('insufficient_permissions')`.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(PERMISSIONS_RESOLVER) private readonly resolver: PermissionsResolver,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requirement = this.reflector.getAllAndOverride<PermissionRequirement | undefined>(
            PERMISSION_METADATA_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requirement) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithUser | undefined>();
        const user = request?.user;
        if (!user || typeof user.sub !== 'string' || user.sub.length === 0) {
            throw new UnauthorizedException('unauthenticated');
        }

        const authContext = {
            request,
            user: user as { sub: string; [k: string]: unknown },
        };
        const ok = this.resolver.authorize
            ? await this.resolver.authorize({ ...authContext, requirement })
            : await this.checkWithResolvedPermissions(authContext, requirement);

        if (!ok) {
            throw new ForbiddenException('insufficient_permissions');
        }
        return true;
    }

    private async checkWithResolvedPermissions(
        authContext: {
            readonly request: unknown;
            readonly user: { readonly sub: string; readonly [key: string]: unknown };
        },
        requirement: PermissionRequirement,
    ): Promise<boolean> {
        if (!this.resolver.resolve) {
            throw new Error('PermissionsResolver must implement `authorize` or `resolve`.');
        }
        const granted = await this.resolver.resolve(authContext);
        const grantedKeys = granted as readonly PermissionKey[];
        return requirement.mode === 'all'
            ? requirement.keys.every((k) => PERMISSIONS.covers(grantedKeys, k))
            : requirement.keys.some((k) => PERMISSIONS.covers(grantedKeys, k));
    }
}
