import { P, PermissionGuard, RequirePermission } from '@nam088/permission';
import { ApiEndpoint, successResponse } from '@nam088/utils';
import { Body, Controller, Get, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';

import {
    LoginAuthRequestDto,
    LoginAuthResponseDto,
    LogoutAuthResponseDto,
    MeAuthResponseDto,
    RefreshTokenRequestDto,
    RegisterAuthRequestDto,
    RegisterAuthResponseDto,
} from '../../../dto/register-auth.dto';
import { JwtAccessGuard } from '../guards/jwt-access.guard';
import { JwtRefreshGuard } from '../guards/jwt-refresh.guard';
import { AuthGatewayService } from '../services/auth-gateway.service';
import { AuthenticatedUser } from '../types/auth-user.type';

@Controller('auth')
export class AuthController {
    constructor(private readonly authGateway: AuthGatewayService) {}

    @Get('ping')
    pingAuth(@Query('name') name = 'api-gateway') {
        return this.authGateway.pingAuth(name);
    }

    @Post('register')
    @ApiEndpoint({
        summary: 'Register user account',
        description: 'Creates a new auth user and returns register result in standard response envelope.',
        success: [
            {
                status: 201,
                description: 'Register success',
                payload: {
                    models: [RegisterAuthResponseDto],
                },
            },
        ],
        errors: [{ status: 409, description: 'Email already exists' }],
    })
    async registerAuth(@Body() body: RegisterAuthRequestDto) {
        const registerResult = await this.authGateway.registerAuth(body);
        return successResponse(registerResult, 'Register success');
    }

    @Post('login')
    @ApiEndpoint({
        summary: 'Login user account',
        description: 'Authenticates user and returns access/refresh tokens in standard response envelope.',
        success: [
            {
                status: 200,
                description: 'Login success',
                payload: {
                    models: [LoginAuthResponseDto],
                },
            },
        ],
        errors: [{ status: 401, description: 'Invalid credentials' }],
    })
    async loginAuth(@Body() body: LoginAuthRequestDto) {
        const loginResult = await this.authGateway.loginAuth(body);
        return successResponse(loginResult, 'Login success');
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    @ApiEndpoint({
        summary: 'Refresh token pair',
        description: 'Rotates refresh token and returns a new access/refresh pair.',
        success: [
            {
                status: 200,
                description: 'Refresh success',
                payload: {
                    models: [LoginAuthResponseDto],
                },
            },
        ],
        errors: [{ status: 401, description: 'Refresh token invalid or expired' }],
    })
    async refreshAuth(@Body() body: RefreshTokenRequestDto) {
        const refreshResult = await this.authGateway.refreshAuth(body);
        return successResponse(refreshResult, 'Refresh success');
    }

    @Post('logout')
    @UseGuards(JwtAccessGuard)
    @ApiEndpoint({
        summary: 'Logout current user',
        description: 'Invalidates the active refresh session for the authenticated user.',
        success: [
            {
                status: 200,
                description: 'Logout success',
                payload: {
                    models: [LogoutAuthResponseDto],
                },
            },
        ],
        errors: [{ status: 401, description: 'Access token invalid or expired' }],
    })
    async logoutAuth(@Req() req: { user?: AuthenticatedUser }) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('invalid_access_token');
        }
        const logoutResult = await this.authGateway.logoutAuth({ userId: req.user.sub });
        return successResponse(logoutResult, 'Logout success');
    }

    @Get('me')
    @UseGuards(JwtAccessGuard)
    @ApiEndpoint({
        summary: 'Get authenticated user',
        description: 'Returns current user claims extracted from access token.',
        success: [
            {
                status: 200,
                description: 'Get profile success',
                payload: {
                    models: [MeAuthResponseDto],
                },
            },
        ],
        errors: [{ status: 401, description: 'Access token invalid or expired' }],
    })
    getMe(@Req() req: { user?: AuthenticatedUser }) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('invalid_access_token');
        }
        return successResponse(
            {
                userId: req.user.sub,
                email: req.user.email ?? '',
                sid: req.user.sid,
            },
            'Get profile success',
        );
    }

    @Get('demo-user-read')
    @UseGuards(JwtAccessGuard, PermissionGuard)
    @RequirePermission(P.user.read)
    @ApiEndpoint({
        summary: 'Demo: check user read permission',
        description: 'Simple permission demo endpoint. Permission decision is resolved via Auth gRPC flow.',
        success: [{ description: 'Permission check success' }],
        errors: [{ status: 403, description: 'Missing required permission user:read' }],
        auth: [
            {
                type: 'bearer',
            },
        ],
    })
    demoUserRead(@Req() req: { user?: AuthenticatedUser }) {
        if (!req.user?.sub) {
            throw new UnauthorizedException('invalid_access_token');
        }
        return successResponse(
            {
                userId: req.user.sub,
                sid: req.user.sid,
                requiredPermission: P.user.read,
            },
            'User read permission granted',
        );
    }
}
