import { auth } from '@nam088/grpc';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthService } from '../../auth.service';
import { RegisterCommand } from './register.command';

@CommandHandler(RegisterCommand)
export class RegisterCommandHandler implements ICommandHandler<RegisterCommand, auth.v1.RegisterResponse> {
    constructor(private readonly authService: AuthService) {}

    async execute(command: RegisterCommand): Promise<auth.v1.RegisterResponse> {
        return this.authService.register({
            email: command.email,
            name: command.name,
            password: command.password,
            idempotencyKey: command.idempotencyKey,
        });
    }
}
