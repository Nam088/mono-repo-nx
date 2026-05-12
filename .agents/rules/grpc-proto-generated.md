---
trigger: always_on
glob: **/*.proto
description: Guidelines for managing gRPC proto files and generated TypeScript code.
---

# gRPC & generated code

- **Source of truth**: edit `libs/grpc/proto/**/*.proto` only. Do not edit `libs/grpc/src/lib/generated/**` by hand (Buf/ts-proto will overwrite it).
- **Generate**: from repo root run `npx nx run grpc:generate` or `npm run grpc:generate`. After proto changes, rerun and commit both proto and generated files.
- **Imports in apps**: use `@nam088/grpc` (see [`tsconfig.base.json`](tsconfig.base.json) `paths`); do not deep-import into `libs/grpc/src/...` from outside the lib.
- **Breaking changes**: when changing fields or RPCs, update every consumer (`apps/auth`, `apps/api`, etc.) in the same PR; use `optional` when you need temporary compatibility.

## Anti-patterns

- Copy-pasting generated types into an app instead of using `auth.v1.*` from `@nam088/grpc`.
