import { AppConfigService } from '@nam088/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthenticatedUser } from '../types/auth-user.type';

type AccessJwtPayload = {
    sub: string;
    email?: string;
    sid: string;
    typ: 'access' | 'refresh';
    iat?: number;
    exp?: number;
};

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(appConfigService: AppConfigService) {
        const jwtConfig = appConfigService.getJwtConfig();
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtConfig.JWT_ACCESS_SECRET,
            ignoreExpiration: false,
            issuer: jwtConfig.JWT_ISSUER,
            audience: jwtConfig.JWT_AUDIENCE,
            algorithms: ['HS256'],
        });
    }

    validate(payload: AccessJwtPayload): AuthenticatedUser {
        if (payload.typ !== 'access' || !payload.sub || !payload.sid) {
            throw new UnauthorizedException('invalid_access_token');
        }

        return {
            sub: payload.sub,
            email: payload.email,
            sid: payload.sid,
            typ: payload.typ,
            iat: payload.iat,
            exp: payload.exp,
        };
    }
}
