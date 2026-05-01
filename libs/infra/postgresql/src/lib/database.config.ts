import { Migrator } from '@mikro-orm/migrations';
import type { Options } from '@mikro-orm/postgresql';
import { defineConfig } from '@mikro-orm/postgresql';
import type { AppConfigService } from '@nam088/config';

import { IdempotencyKeyEntity } from './entities/idempotency-key.entity';
import { OutboxEventEntity } from './entities/outbox-event.entity';
import { ProcessedMessageEntity } from './entities/processed-message.entity';
import { UserEntity } from './entities/user.entity';

export function buildDatabaseConfig(appConfigService: AppConfigService): Options {
    const databaseConfig = appConfigService.getDatabaseConfig();

    return defineConfig({
        host: databaseConfig.POSTGRES_HOST,
        port: databaseConfig.POSTGRES_PORT,
        dbName: databaseConfig.POSTGRES_DB,
        user: databaseConfig.POSTGRES_USER,
        password: databaseConfig.POSTGRES_PASSWORD,
        entities: [UserEntity, IdempotencyKeyEntity, OutboxEventEntity, ProcessedMessageEntity],
        extensions: [Migrator],
        debug: false,
    }) as Options;
}
