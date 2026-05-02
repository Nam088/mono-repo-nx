import { auth } from '@nam088/grpc';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PingAuthCommand } from './ping-auth.command';

@CommandHandler(PingAuthCommand)
export class PingAuthCommandHandler implements ICommandHandler<PingAuthCommand, auth.v1.PingResponse> {
    async execute(command: PingAuthCommand): Promise<auth.v1.PingResponse> {
        const normalizedName = command.name?.trim() || 'anonymous';
        return { message: `AUTH command received: ${normalizedName}` };
    }
}
