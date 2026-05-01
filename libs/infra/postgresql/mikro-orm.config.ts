import { join } from 'node:path';

import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';
import { parseEnv } from '@nam088/config';

const env = parseEnv(process.env);

export default defineConfig({
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    dbName: env.POSTGRES_DB,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    preferTs: true,
    entities: [join(process.cwd(), 'dist/libs/infra/postgresql/src/lib/entities/user.entity.js')],
    entitiesTs: [join(process.cwd(), 'libs/infra/postgresql/src/lib/entities/user.entity.ts')],
    extensions: [Migrator, SeedManager],
    migrations: {
        path: join(process.cwd(), 'libs/infra/postgresql/migrations'),
        pathTs: join(process.cwd(), 'libs/infra/postgresql/migrations'),
        transactional: true,
        allOrNothing: true,
    },
    seeder: {
        path: join(process.cwd(), 'libs/infra/postgresql/seeders'),
        pathTs: join(process.cwd(), 'libs/infra/postgresql/seeders'),
        defaultSeeder: 'DatabaseSeeder',
    },
    debug: false,
});
