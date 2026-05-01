import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { AppService } from '../../app.service';
import { AuthenticatedUser } from './auth-user.type';

type RequestLike = {
    headers?: Record<string, string | string[] | undefined>;
    user?: AuthenticatedUser;
};

@Injectable()
export class JwtAccessGuard implements CanActivate {
    constructor(private readonly appService: AppService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestLike>();
        const accessToken = this.extractBearerToken(request.headers?.authorization);
        if (!accessToken) {
            throw new UnauthorizedException('invalid_access_token');
        }

        const validated = await this.appService.validateAccessToken({ accessToken });
        request.user = {
            sub: validated.userId,
            email: validated.email || undefined,
            sid: validated.sid,
            typ: 'access',
        };
        return true;
    }

    private extractBearerToken(authorization: string | string[] | undefined): string | null {
        const value = Array.isArray(authorization) ? authorization[0] : authorization;
        if (!value) {
            return null;
        }
        const [scheme, token] = value.split(' ');
        if (scheme?.toLowerCase() !== 'bearer' || !token) {
            return null;
        }
        return token;
    }
}
