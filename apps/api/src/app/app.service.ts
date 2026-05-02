import { Injectable } from '@nestjs/common';

import { AuthGatewayService } from './modules/auth/services/auth-gateway.service';

@Injectable()
export class AppService {
    constructor(private readonly authGateway: AuthGatewayService) {}

    async getData() {
        return this.authGateway.getStatus();
    }
}
