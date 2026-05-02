import { auth } from '@nam088/grpc';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AuthService } from '../../services/auth.service';
import { GetUserPermissionsCommand } from '../commands/get-user-permissions.command';

@CommandHandler(GetUserPermissionsCommand)
export class GetUserPermissionsHandler implements ICommandHandler<
    GetUserPermissionsCommand,
    auth.v1.GetUserPermissionsResponse
> {
    constructor(private readonly authService: AuthService) {}

    async execute(command: GetUserPermissionsCommand): Promise<auth.v1.GetUserPermissionsResponse> {
        return this.authService.getUserPermissions({
            userId: command.userId,
            sid: command.sid,
        });
    }
}
