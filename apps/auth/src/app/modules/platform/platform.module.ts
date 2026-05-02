import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { PingAuthCommandHandler } from './commands/ping-auth.handler';
import { GetAuthStatusQueryHandler } from './queries/get-auth-status.handler';

@Module({
    imports: [CqrsModule],
    providers: [PingAuthCommandHandler, GetAuthStatusQueryHandler],
})
export class PlatformModule {}
