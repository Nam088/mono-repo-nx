import { ApiEndpoint, successResponse } from '@nam088/utils';
import { Body, Controller, Get, Post, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import {
    LoginAuthRequestDto,
    LoginAuthResponseDto,
    LogoutAuthResponseDto,
    MeAuthResponseDto,
    RefreshTokenRequestDto,
    RegisterAuthRequestDto,
    RegisterAuthResponseDto,
} from './dto/register-auth.dto';
import { AuthenticatedUser } from './modules/auth/auth-user.type';
import { JwtAccessGuard } from './modules/auth/jwt-access.guard';
import { JwtRefreshGuard } from './modules/auth/jwt-refresh.guard';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getData() {
        return this.appService.getData();
    }

    @Get('auth/ping')
    pingAuth(@Query('name') name = 'api-gateway') {
        return this.appService.pingAuth(name);
    }

    @Post('auth/register')
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
        const registerResult = await this.appService.registerAuth({
            email: body.email,
            name: body.name,
            password: body.password,
            idempotencyKey: body.idempotencyKey,
        });
        return successResponse(registerResult, 'Register success');
    }

    @Post('auth/login')
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
        const loginResult = await this.appService.loginAuth({
            email: body?.email ?? '',
            password: body?.password ?? '',
        });
        return successResponse(loginResult, 'Login success');
    }

    @Post('auth/refresh')
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
        const refreshResult = await this.appService.refreshAuth({ refreshToken: body.refreshToken });
        return successResponse(refreshResult, 'Refresh success');
    }

    @Post('auth/logout')
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
        const logoutResult = await this.appService.logoutAuth({ userId: req.user.sub });
        return successResponse(logoutResult, 'Logout success');
    }

    @Get('auth/me')
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
}
