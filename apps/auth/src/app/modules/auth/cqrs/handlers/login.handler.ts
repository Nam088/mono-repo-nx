import { auth } from '@nam088/grpc';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthService } from '../../services/auth.service';
import { LoginCommand } from '../commands/login.command';

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand, auth.v1.LoginResponse> {
    constructor(private readonly authService: AuthService) {}

    async execute(command: LoginCommand): Promise<auth.v1.LoginResponse> {
        return this.authService.login({
            email: command.email,
            password: command.password,
        });
    }
}
