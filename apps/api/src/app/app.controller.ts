import { Controller, Get, Query } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getData() {
        return this.appService.getData();
    }

    @Get('auth/ping')
    pingAuth(@Query('name') name = 'api-gateway') {
        return this.appService.pingAuth(name);
    }
}
