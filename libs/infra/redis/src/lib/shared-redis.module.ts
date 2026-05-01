import { AppConfigService } from '@nam088/config';
import { DynamicModule, Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({})
export class SharedRedisModule {
    static forRoot(): DynamicModule {
        return {
            module: SharedRedisModule,
            providers: [
                {
                    provide: REDIS_CLIENT,
                    inject: [AppConfigService],
                    useFactory: (appConfigService: AppConfigService) => {
                        const redisConfig = appConfigService.getRedisConfig();
                        return new Redis({
                            host: redisConfig.REDIS_HOST,
                            port: redisConfig.REDIS_PORT,
                            db: redisConfig.REDIS_DB,
                            password: redisConfig.REDIS_PASSWORD,
                        });
                    },
                },
                RedisService,
            ],
            exports: [REDIS_CLIENT, RedisService],
        };
    }
}
