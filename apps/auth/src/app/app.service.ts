import { auth } from '@nam088/grpc';
import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { PingAuthCommand } from './cqrs/commands/ping-auth.command';
import { GetAuthStatusQuery } from './cqrs/queries/get-auth-status.query';

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
}
