import { auth } from '@nam088/grpc';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthService } from '../../auth.service';
import { LogoutCommand } from './logout.command';

@CommandHandler(LogoutCommand)
export class LogoutCommandHandler implements ICommandHandler<LogoutCommand, auth.v1.LogoutResponse> {
    constructor(private readonly authService: AuthService) {}

    async execute(command: LogoutCommand): Promise<auth.v1.LogoutResponse> {
        return this.authService.logout({ userId: command.userId });
    }
}
