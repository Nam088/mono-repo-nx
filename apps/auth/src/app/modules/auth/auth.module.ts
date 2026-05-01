import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

import { GrpcLoggingInterceptor } from '../../interceptors/grpc-logging.interceptor';
import { AuthService } from './auth.service';
import { AuthGrpcController } from './auth-grpc.controller';
import { LoginCommandHandler } from './cqrs/commands/login.handler';
import { LogoutCommandHandler } from './cqrs/commands/logout.handler';
import { RefreshTokenCommandHandler } from './cqrs/commands/refresh-token.handler';
import { RegisterCommandHandler } from './cqrs/commands/register.handler';
import { ValidateAccessTokenHandler } from './cqrs/commands/validate-access-token.handler';

const commandHandlers = [
    RegisterCommandHandler,
    LoginCommandHandler,
    RefreshTokenCommandHandler,
    LogoutCommandHandler,
    ValidateAccessTokenHandler,
];

@Module({
    imports: [CqrsModule, JwtModule.register({})],
    controllers: [AuthGrpcController],
    providers: [AuthService, GrpcLoggingInterceptor, ...commandHandlers],
    exports: [AuthService, ...commandHandlers],
})
export class AuthModule {}
