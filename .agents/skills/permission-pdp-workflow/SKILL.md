---
name: permission-pdp-workflow
description: Use when adding or refactoring authorization in this repository, especially @nam088/permission decorator/guard/resolver logic, registry declarations, and Auth-PDP integration patterns.
---

# Permission PDP Workflow

## Goal

Keep authorization scalable by separating:

- Enforcement in API/Nest guards (PEP)
- Decision logic in Auth service or resolver backend (PDP)

while preserving type-safe permission declarations in `@nam088/permission`.

## When to use this skill

Use this skill when tasks mention:

- `@RequirePermission(...)`
- `PermissionGuard`, `PermissionModule`, `PermissionsResolver`
- role/permission mapping
- Redis permission keys
- Auth gRPC authorization checks
- adding new permission resources/actions/groups

## Architecture rules

1. Keep endpoint permission requirements declarative in controller decorators.
2. Prefer centralized decision in Auth/PDP for long-term scale.
3. Do not duplicate policy logic across multiple apps/services.
4. Keep registry declaration as the single permission taxonomy source.
5. Preserve backward compatibility where practical:
    - `resolve(ctx)` mode (local covers)
    - `authorize(ctx)` mode (remote decision)

## Library touchpoints

Primary files:

- `libs/security/permission/src/registry.ts`
- `libs/security/permission/src/lib/build-registry.ts`
- `libs/security/permission/src/lib/define-permissions.ts`
- `libs/security/permission/src/lib/nest/require-permission.decorator.ts`
- `libs/security/permission/src/lib/nest/permission.guard.ts`
- `libs/security/permission/src/lib/nest/permissions-resolver.interface.ts`
- `libs/security/permission/src/lib/nest/permission.module.ts`
- `libs/security/permission/src/index.ts`

Permission declarations:

- `libs/security/permission/src/domains/*.permissions.ts`

Generated refs:

- `libs/security/permission/src/refs.generated.ts`
- `libs/security/permission/tools/generate-permission-refs.ts`

## Change workflow

1. Update permission declarations in domain files.
2. Regenerate refs (`generate-refs`) if declaration keys/descriptions changed.
3. Adjust guard/resolver/module contracts if auth flow changes.
4. Export only necessary API from `src/index.ts`.
5. Add/update tests for changed behavior.

## Design guardrails

- Use `implies` for dependency semantics, `includes` for grouping semantics.
- Keep `@RequirePermission` as the user-facing declarative API.
- Avoid introducing multiple overlapping decorators unless required.
- If adding network authorization, prefer resolver-based adapter rather than hard-coding transport in guard.
- Fail closed on malformed/missing permission data.

## Verification checklist

Run for every substantive permission change:

```bash
npx nx lint permission
npx nx test permission
npx nx build permission
```

If gRPC contract changed:

```bash
npx nx run grpc:generate
```

Then re-run affected app/lib tests.

## Reporting checklist

In your final update, include:

1. Files changed
2. Behavior change summary
3. Verification commands and outcomes
4. Remaining risks or deferred follow-ups
