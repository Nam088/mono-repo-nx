import { AppConfigService } from '@nam088/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthenticatedUser } from '../types/auth-user.type';

type RefreshJwtPayload = {
    sub: string;
    sid: string;
    jti: string;
    typ: 'access' | 'refresh';
    iat?: number;
    exp?: number;
};

function extractRefreshToken(req: { body?: Record<string, unknown> }): string | null {
    const token = req?.body?.refreshToken;
    return typeof token === 'string' ? token : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(appConfigService: AppConfigService) {
        const jwtConfig = appConfigService.getJwtConfig();
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
            secretOrKey: jwtConfig.JWT_REFRESH_SECRET,
            ignoreExpiration: false,
            issuer: jwtConfig.JWT_ISSUER,
            audience: jwtConfig.JWT_AUDIENCE,
            algorithms: ['HS256'],
        });
    }

    validate(payload: RefreshJwtPayload): AuthenticatedUser {
        if (payload.typ !== 'refresh' || !payload.sub || !payload.sid || !payload.jti) {
            throw new UnauthorizedException('refresh_invalid');
        }

        return {
            sub: payload.sub,
            sid: payload.sid,
            typ: payload.typ,
            iat: payload.iat,
            exp: payload.exp,
        };
    }
}
