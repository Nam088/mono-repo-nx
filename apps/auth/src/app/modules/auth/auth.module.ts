import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';

import { AuthGrpcController } from './controllers/auth-grpc.controller';
import { GetUserPermissionsHandler } from './cqrs/handlers/get-user-permissions.handler';
import { LoginCommandHandler } from './cqrs/handlers/login.handler';
import { LogoutCommandHandler } from './cqrs/handlers/logout.handler';
import { RefreshTokenCommandHandler } from './cqrs/handlers/refresh-token.handler';
import { RegisterCommandHandler } from './cqrs/handlers/register.handler';
import { ValidateAccessTokenHandler } from './cqrs/handlers/validate-access-token.handler';
import { GrpcLoggingInterceptor } from './interceptors/grpc-logging.interceptor';
import { AuthService } from './services/auth.service';

const commandHandlers = [
    RegisterCommandHandler,
    LoginCommandHandler,
    RefreshTokenCommandHandler,
    LogoutCommandHandler,
    ValidateAccessTokenHandler,
    GetUserPermissionsHandler,
];

@Module({
    imports: [CqrsModule, JwtModule.register({})],
    controllers: [AuthGrpcController],
    providers: [AuthService, GrpcLoggingInterceptor, ...commandHandlers],
    exports: [AuthService, ...commandHandlers],
})
export class AuthModule {}
