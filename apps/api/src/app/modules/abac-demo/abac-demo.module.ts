import { Module } from '@nestjs/common';

import { AbacDemoController } from './abac-demo.controller';

@Module({
    controllers: [AbacDemoController],
    providers: [], // No need to declare here anymore as PolicyModule is global
})
export class AbacDemoModule {}
