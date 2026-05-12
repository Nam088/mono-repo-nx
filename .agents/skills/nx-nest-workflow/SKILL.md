---
name: nx-nest-workflow
description: Standardize Nx/NestJS development in this repository. Use when creating or moving apps/libs, running serve/build/test/lint commands, configuring Vitest/Jest, or fixing project.json/tsconfig mismatches in the mono-repo-nx workspace.
---

# Nx Nest Workflow

## Goal

Apply consistent commands and structure for this workspace:

- Apps live in `apps/`
- Shared libs live in `libs/`
- Prefer Vitest for tests unless the user requests Jest
- Use `nvn-` naming for Docker resources (containers, images, volumes)

## Creation Rules

Use these defaults when generating new projects:

```bash
# Nest app
npx nx g @nx/nest:app apps/<app-name> --name=<app-name> --e2eTestRunner=none --no-interactive

# Shared TypeScript lib
npx nx g @nx/js:lib libs/<lib-name> --name=<lib-name> --unitTestRunner=vitest --no-interactive
```

If something was generated in the wrong place (workspace root), remove and regenerate in `apps/` or `libs/`.

## Runtime Commands

Use these common commands:

```bash
# Serve app
npx nx serve <app-name>

# Build app
npx nx build <app-name>

# Test lib/app
npx nx test <project-name>

# Show projects
npx nx show projects
```

## Config Guardrails

When TypeScript module errors appear:

- If `moduleResolution` is `node16`, set `module` to `Node16`.
- Keep app tsconfig aligned with workspace base tsconfig.
- For nested project configs, set `module: Node16` in:
    - `apps/*/tsconfig.app.json`
    - `apps/*-e2e/tsconfig.spec.json`
    - `libs/*/tsconfig.lib.json`

When webpack CLI argument errors appear:

- Prefer `--mode=production|development` over deprecated or unsupported flags.

When converting Jest to Vitest:

- Run `npx nx g @nx/vitest:configuration --project=<project-name> --no-interactive`.
- Keep one active test target per project (`test` preferred) to avoid confusion.
- Verify generated `vitest.config.mts` and `tsconfig.spec.json` are included in project files.

## Fast Fix Recipes

TypeScript Node16 mismatch:

```bash
npx tsc -p <project-tsconfig>.json --noEmit
```

If it fails with Node16/module mismatch, patch the closest tsconfig `compilerOptions.module` to `Node16`, then rerun.

Wrong project location after generate:

```bash
npx nx g remove <project-name> --no-interactive
# regenerate into apps/ or libs/
```

MikroORM v7 in Nx Nest app:

- Use legacy decorators import:
    - `@mikro-orm/decorators/legacy`
- Entity fields should declare explicit `type` in decorators to avoid metadata discovery errors, for example:
    - `@PrimaryKey({ type: 'string' })`
    - `@Property({ type: 'string', length: 120 })`
- Wire database with:
    - `ConfigModule.forRoot({ isGlobal: true })`
    - `MikroOrmModule.forRootAsync(...)`
    - `MikroOrmModule.forFeature([...])`
- If ESM/CJS conflicts appear, keep webpack config CommonJS and avoid forcing `type: module` at app level unless required.

Docker infra conventions:

- `docker-compose.yml` uses two env files:
    - `.env` for credentials/app defaults
    - `.env.docker` for host port bindings
- Use fallback syntax `${VAR:-default}` in compose for resilience.
- Namespace resources with `nvn-`:
    - containers: `nvn-postgres`, `nvn-redis`, `nvn-rabbitmq`
    - volumes: `nvn-postgres-data`, `nvn-redis-data`
- Docker image tags for apps:
    - `nvn-api`
    - `nvn-auth`

TypeScript module mode selection:

- For Nx apps built with webpack/vite bundling:
    - prefer `module: "esnext"` with `moduleResolution: "bundler"`
- For Node runtime-semantic projects (no bundler-first flow):
    - use `module: "Node16"` or `module: "NodeNext"`
- Avoid mixing Node16 resolution with CommonJS output in nested tsconfig files.
- If you see ESM/CJS import errors with MikroORM v7 packages, switch app tsconfig to bundler-style module settings.

## Verification Checklist

After changes, run:

```bash
npx nx show projects
npx nx build <affected-app>
npx nx test <affected-project>
npx tsc -p <affected-tsconfig>.json --noEmit
```

Report:

1. What changed
2. Verification commands run
3. Remaining warnings or follow-ups
