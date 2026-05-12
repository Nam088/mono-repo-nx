import type { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';

import { UserEntity } from '../src/lib/entities/user.entity';

export class DatabaseSeeder extends Seeder {
    async run(em: EntityManager): Promise<void> {
        const existing = await em.findOne(UserEntity, { email: 'admin@nvn.local' });

        if (!existing) {
            em.create(UserEntity, {
                email: 'admin@nvn.local',
                name: 'System Admin',
                // passwordHash: 'admin',
            });
        }
    }
}
