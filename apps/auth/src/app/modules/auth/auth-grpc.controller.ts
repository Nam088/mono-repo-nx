import { auth } from '@nam088/grpc';
import { Controller, Get } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { PingAuthCommand } from '../../cqrs/commands/ping-auth.command';
import { GetAuthStatusQuery } from '../../cqrs/queries/get-auth-status.query';
import { LoginCommand } from './cqrs/commands/login.command';
import { LogoutCommand } from './cqrs/commands/logout.command';
import { RefreshTokenCommand } from './cqrs/commands/refresh-token.command';
import { RegisterCommand } from './cqrs/commands/register.command';
import { ValidateAccessTokenCommand } from './cqrs/commands/validate-access-token.command';

@Controller()
@auth.v1.AuthServiceControllerMethods()
export class AuthGrpcController implements auth.v1.AuthServiceController {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    @Get()
    getData() {
        return this.queryBus.execute(new GetAuthStatusQuery());
    }

    getStatus(_: auth.v1.GetStatusRequest): Promise<auth.v1.GetStatusResponse> {
        return this.queryBus.execute(new GetAuthStatusQuery());
    }

    ping(data: auth.v1.PingRequest): Promise<auth.v1.PingResponse> {
        return this.commandBus.execute(new PingAuthCommand(data.name ?? 'anonymous'));
    }

    register(data: auth.v1.RegisterRequest): Promise<auth.v1.RegisterResponse> {
        return this.commandBus.execute(
            new RegisterCommand(data.email, data.name, data.password, data.idempotencyKey ?? undefined),
        );
    }

    login(data: auth.v1.LoginRequest): Promise<auth.v1.LoginResponse> {
        return this.commandBus.execute(new LoginCommand(data.email, data.password));
    }

    validateAccessToken(data: auth.v1.ValidateAccessTokenRequest): Promise<auth.v1.ValidateAccessTokenResponse> {
        return this.commandBus.execute(new ValidateAccessTokenCommand(data.accessToken));
    }

    refreshToken(data: auth.v1.RefreshTokenRequest): Promise<auth.v1.LoginResponse> {
        return this.commandBus.execute(new RefreshTokenCommand(data.refreshToken));
    }

    logout(data: auth.v1.LogoutRequest): Promise<auth.v1.LogoutResponse> {
        return this.commandBus.execute(new LogoutCommand(data.userId));
    }
}
