import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { JwtRefreshStrategy } from './jwt-refresh.strategy';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'jwt-access' })],
    providers: [JwtRefreshStrategy],
    exports: [PassportModule, JwtRefreshStrategy],
})
export class GatewayAuthModule {}
