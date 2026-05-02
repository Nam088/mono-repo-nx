import { auth } from '@nam088/grpc';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthService } from '../../services/auth.service';
import { ValidateAccessTokenCommand } from '../commands/validate-access-token.command';

@CommandHandler(ValidateAccessTokenCommand)
export class ValidateAccessTokenHandler implements ICommandHandler<
    ValidateAccessTokenCommand,
    auth.v1.ValidateAccessTokenResponse
> {
    constructor(private readonly authService: AuthService) {}

    async execute(command: ValidateAccessTokenCommand): Promise<auth.v1.ValidateAccessTokenResponse> {
        return this.authService.validateAccessToken({ accessToken: command.accessToken });
    }
}
