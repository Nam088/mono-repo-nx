import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import { validateEnv } from './env.validate';

@Global()
@Module({})
export class SharedConfigModule {
    static forRoot(): DynamicModule {
        return {
            module: SharedConfigModule,
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    validate: validateEnv,
                }),
            ],
            providers: [AppConfigService],
            exports: [AppConfigService],
        };
    }
}
