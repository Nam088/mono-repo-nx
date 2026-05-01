# grpc

Shared gRPC library for this monorepo.

## Structure

- `libs/grpc/proto`: source-of-truth protobuf contracts (`<domain>/v<version>`).
- `libs/grpc/src/lib/generated`: generated TypeScript from proto (`ts-proto`).
- `libs/grpc/src/lib/grpc.ts`: shared runtime helpers/constants for Nest server and client wiring.

## Commands

- Generate code: `nx run grpc:generate` (powered by `buf generate`)
- Build library: `nx build grpc`
- Test library: `nx test grpc`
