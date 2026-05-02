---
name: db-migration-mikro
description: MikroORM migrations and PostgreSQL entities in libs/infra/postgresql. Use when adding or changing entities, creating or applying migrations, running db:migration scripts, or syncing the schema snapshot.
disable-model-invocation: true
---

# DB migrations (MikroORM)

## Layout

- **Entities**: `libs/infra/postgresql/src/lib/entities/*.entity.ts`
- **Schema registration**: `libs/infra/postgresql/src/lib/database.config.ts` (`entities: [...]`)
- **Public exports**: `libs/infra/postgresql/src/index.ts`
- **Migrations**: `libs/infra/postgresql/migrations/*.ts`
- **CLI config**: `libs/infra/postgresql/mikro-orm.config.ts`

## Commands (from root `package.json`)

- `npm run db:migration:create` — create a new migration (requires DB/env matching config).
- `npm run db:migration:up` / `db:migration:down` / `db:migration:list`
- Wrapper: `TS_NODE_PROJECT=libs/infra/postgresql/tsconfig.mikro-orm.json` with `mikro-orm.config.ts`

## Repo conventions

- Follow MikroORM v7 legacy decorator patterns already used in this codebase (see `nx-nest-workflow` skill).
- After removing an entity: update `database.config.ts` and `index.ts`; add a `DROP TABLE IF EXISTS` migration when dropping tables on environments that already ran migrations; update `.snapshot-app_db.json` if the team relies on it for diffs (or regenerate via CLI when available).

## Verify

- `npx nx run infra-postgresql:build`
- For apps using the DB: `npx nx build auth` / `npx nx build api` as appropriate.
