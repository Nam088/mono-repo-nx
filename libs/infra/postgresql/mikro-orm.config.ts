import { join } from 'node:path';

import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { SeedManager } from '@mikro-orm/seeder';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { parseEnv } from '../../config/src/lib/config';

const parsedEnv = parseEnv(process.env);

export default defineConfig({
    host: parsedEnv.POSTGRES_HOST,
    port: parsedEnv.POSTGRES_PORT,
    dbName: parsedEnv.POSTGRES_DB,
    user: parsedEnv.POSTGRES_USER,
    password: parsedEnv.POSTGRES_PASSWORD,
    preferTs: true,
    entities: [join(process.cwd(), 'dist/libs/infra/postgresql/src/lib/entities/*.entity.js')],
    entitiesTs: [join(process.cwd(), 'libs/infra/postgresql/src/lib/entities/*.entity.ts')],
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
