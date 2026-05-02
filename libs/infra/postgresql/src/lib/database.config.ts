import { Migrator } from '@mikro-orm/migrations';
import type { Options } from '@mikro-orm/postgresql';
import { defineConfig } from '@mikro-orm/postgresql';
import type { AppConfigService } from '@nam088/config';

import { UserEntity } from './entities/user.entity';

export function buildDatabaseConfig(appConfigService: AppConfigService): Options {
    const databaseConfig = appConfigService.getDatabaseConfig();

    return defineConfig({
        host: databaseConfig.POSTGRES_HOST,
        port: databaseConfig.POSTGRES_PORT,
        dbName: databaseConfig.POSTGRES_DB,
        user: databaseConfig.POSTGRES_USER,
        password: databaseConfig.POSTGRES_PASSWORD,
        entities: [UserEntity],
        extensions: [Migrator],
        debug: false,
    }) as Options;
}
