import { Global, Module } from '@nestjs/common';
import { DiscoveryModule as NestDiscoveryModule } from '@nestjs/core';

import { DiscoveryService } from './discovery.service';

@Global()
@Module({
    imports: [NestDiscoveryModule],
    providers: [DiscoveryService],
    exports: [DiscoveryService],
})
export class DiscoveryModule {}
