import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AbacDemoController } from './abac-demo.controller';

@Module({
    imports: [AuthModule],
    controllers: [AbacDemoController],
})
export class AbacDemoModule {}
