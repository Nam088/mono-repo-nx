import { auth } from '@nam088/grpc';
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { PingAuthCommand } from './cqrs/commands/ping-auth.command';
import { GetAuthStatusQuery } from './cqrs/queries/get-auth-status.query';
import { LoginCommand } from './modules/auth/cqrs/commands/login.command';
import { LogoutCommand } from './modules/auth/cqrs/commands/logout.command';
import { RefreshTokenCommand } from './modules/auth/cqrs/commands/refresh-token.command';
import { RegisterCommand } from './modules/auth/cqrs/commands/register.command';

@Injectable()
export class AppService {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    getData(): Promise<auth.v1.GetStatusResponse> {
        return this.queryBus.execute(new GetAuthStatusQuery());
    }

    ping(name: string): Promise<auth.v1.PingResponse> {
        return this.commandBus.execute(new PingAuthCommand(name));
    }

    register(data: auth.v1.RegisterRequest): Promise<auth.v1.RegisterResponse> {
        return this.commandBus.execute(
            new RegisterCommand(data.email, data.name, data.password, data.idempotencyKey ?? undefined),
        );
    }

    login(data: auth.v1.LoginRequest): Promise<auth.v1.LoginResponse> {
        return this.commandBus.execute(new LoginCommand(data.email, data.password));
    }

    refreshToken(data: auth.v1.RefreshTokenRequest): Promise<auth.v1.LoginResponse> {
        return this.commandBus.execute(new RefreshTokenCommand(data.refreshToken));
    }

    logout(data: auth.v1.LogoutRequest): Promise<auth.v1.LogoutResponse> {
        return this.commandBus.execute(new LogoutCommand(data.userId));
    }
}
