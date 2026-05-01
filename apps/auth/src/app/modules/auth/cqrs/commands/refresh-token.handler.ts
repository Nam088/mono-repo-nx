import { auth } from '@nam088/grpc';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthService } from '../../auth.service';
import { RefreshTokenCommand } from './refresh-token.command';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler implements ICommandHandler<RefreshTokenCommand, auth.v1.LoginResponse> {
    constructor(private readonly authService: AuthService) {}

    async execute(command: RefreshTokenCommand): Promise<auth.v1.LoginResponse> {
        return this.authService.refreshToken({ refreshToken: command.refreshToken });
    }
}
