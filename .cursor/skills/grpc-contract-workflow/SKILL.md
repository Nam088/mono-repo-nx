---
name: grpc-contract-workflow
description: Change gRPC contracts (proto) in this monorepo—edit protos, run Buf generate, update consumers. Use when editing .proto files, RPCs or messages, adding services used by auth/api apps, or regenerating @nam088/grpc.
disable-model-invocation: true
---

# gRPC contract workflow

## Steps

1. Edit files under `libs/grpc/proto/` (e.g. `libs/grpc/proto/auth/v1/auth.proto`).
2. From repo root: `npx nx run grpc:generate` (or `npm run grpc:generate`). The target runs `buf generate`, Prettier, and the `grpc` project lint.
3. If Nx fails on the project graph or a plugin: try `NX_DAEMON=false npx nx run grpc:generate` or `cd libs/grpc && npx eslint .`.
4. Update TypeScript in every app that used the old shapes (`apps/auth`, `apps/api`, …).
5. Verify: `NX_DAEMON=false npx nx run grpc:build` and build dependent apps (`api`, `auth`) as needed.

## Notes

- Do not hand-edit `libs/grpc/src/lib/generated/**`.
- Import path: `@nam088/grpc` (the lib’s public API); apps must not import relative paths into `libs/grpc/src`.
