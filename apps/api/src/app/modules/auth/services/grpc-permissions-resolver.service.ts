import type { PermissionsResolveContext, PermissionsResolver } from '@nam088/permission';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthGatewayService } from './auth-gateway.service';

@Injectable()
export class GrpcPermissionsResolverService implements PermissionsResolver {
    constructor(private readonly authGatewayService: AuthGatewayService) {}

    async resolve(ctx: PermissionsResolveContext): Promise<readonly string[]> {
        const sid = typeof ctx.user.sid === 'string' ? ctx.user.sid : '';
        if (!sid) {
            throw new UnauthorizedException('invalid_access_token');
        }
        const result = await this.authGatewayService.getUserPermissions({
            userId: ctx.user.sub,
            sid,
        });
        return result.permissions ?? [];
    }
}
