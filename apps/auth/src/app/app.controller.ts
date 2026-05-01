import { auth } from '@nam088/grpc';
import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
@auth.v1.AuthServiceControllerMethods()
export class AppController implements auth.v1.AuthServiceController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getData() {
        return this.appService.getData();
    }

    getStatus(_: auth.v1.GetStatusRequest): Promise<auth.v1.GetStatusResponse> {
        return this.appService.getData();
    }

    ping(data: auth.v1.PingRequest): Promise<auth.v1.PingResponse> {
        return this.appService.ping(data.name ?? 'anonymous');
    }
}
