---
name: permission-abac-workflow
description: Standardize ABAC (Attribute-Based Access Control) implementation using the Abstract Policy Pattern and Strategy Pattern for rules. Use when adding or refactoring resource-level authorization.
---

# ABAC Policy Framework Standard

This skill provides a streamlined approach to resource-level authorization (ABAC) in the NestJS monorepo, replacing complex multi-decorator setups with a unified Policy Pattern.

## Goal

Decouple resource-level authorization logic into dedicated Policy classes to ensure scalability, testability, and a clean separation of concerns.

## When to use this skill

- When creating a new resource (e.g., User, Order, Company) that requires ownership or relationship-based access checks.
- When refactoring existing `@RequirePermission` logic to include granular attribute checks.
- When implementing complex rules like "IsOwner", "IsTeamMember", or "CanAccessDepartment".

## Architecture rules

1. **Policy Class Structure**:
   - Every resource must have exactly one Policy class extending `ResourcePolicy<T>`.
   - Policies should be located in `apps/api/src/app/modules/security/policies/`.
   - **Dependency Injection**: Policies are full NestJS providers and support injecting repositories, services, or other providers.
   - Use the `@PolicyRule(name)` decorator to define specific authorization strategies (Strategy Pattern) instead of `switch/case` blocks.

2. **Controller Usage**:
   - Always combine RBAC (`@RequirePermission`) with ABAC (`@CheckPolicy`).
   - Explicitly declare `@CheckPolicy('ResourceName')` on routes. **Do not rely on auto-inference.**
   - The system defaults to looking for the ID in `params.id`.

3. **Centralized Registration**:
   - Register all Policy classes centrally in the `AppModule` using `PolicyModule.forRoot([Policies])`.

## Library Touchpoints

- Base Class: `libs/security/permission/src/lib/nest/abac/resource-policy.base.ts`
- Guard: `libs/security/permission/src/lib/nest/abac/policy.guard.ts`
- Decorators: `libs/security/permission/src/lib/nest/abac/check-policy.decorator.ts`, `libs/security/permission/src/lib/nest/abac/policy-rule.decorator.ts`

## How to use it

### 1. Create a Policy Class
Implement the `fetch` method to retrieve data and define rules using `@PolicyRule`.

```typescript
@Injectable()
export class UserPolicy extends ResourcePolicy<User> {
  readonly resourceType = 'User';

  async fetch(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  @PolicyRule('update')
  canUpdate(user: PolicyUser, resource: User) {
    return user.sub === resource.id || user.role === 'ADMIN';
  }

  @PolicyRule('IsOwner')
  checkOwner(user: PolicyUser, resource: User) {
    return user.sub === resource.id;
  }
}
```

### 2. Use in Controller
Apply the guards and decorators to your route.

```typescript
@RequirePermission(P.user.update)
@CheckPolicy('User', { rule: 'IsOwner' })
@Put(':id')
updateUser(...) { ... }
```

## Verification Checklist

- [ ] Policy is registered in `AppModule`.
- [ ] `@CheckPolicy` matches the `resourceType` in the Policy class.
- [ ] The ID source (params/body/query) and field name are correctly configured if not using defaults.
- [ ] Unit tests are added for the new Policy logic.
