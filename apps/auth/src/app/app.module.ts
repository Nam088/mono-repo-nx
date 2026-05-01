import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppConfigService, SharedConfigModule } from '@nam088/config';
import { buildDatabaseConfig, UserEntity } from '@nam088/postgresql';
import { SharedRedisModule } from '@nam088/redis';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingAuthCommandHandler } from './cqrs/commands/ping-auth.handler';
import { GetAuthStatusQueryHandler } from './cqrs/queries/get-auth-status.handler';

const commandHandlers = [PingAuthCommandHandler];
const queryHandlers = [GetAuthStatusQueryHandler];

@Module({
    imports: [
        SharedConfigModule.forRoot(),
        SharedRedisModule.forRoot(),
        CqrsModule,
        MikroOrmModule.forRootAsync({
            driver: PostgreSqlDriver,
            inject: [AppConfigService],
            useFactory: (appConfigService: AppConfigService) => buildDatabaseConfig(appConfigService),
        }),
        MikroOrmModule.forFeature([UserEntity]),
    ],
    controllers: [AppController],
    providers: [AppService, ...commandHandlers, ...queryHandlers],
})
export class AppModule {}
