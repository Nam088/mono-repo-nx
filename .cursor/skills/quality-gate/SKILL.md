---
name: quality-gate
description: Enforce delivery quality gates for backend and API changes. Use when implementing or refactoring code to ensure unit tests, lint, and performance impact checks are completed before finalizing.
disable-model-invocation: true
---

# Quality Gate

## Purpose

Apply a mandatory quality checklist before finishing implementation work.

## Required Checklist

For every non-trivial code change:

1. Add or update unit tests for changed behavior.
2. Run project lint/build for affected targets.
3. Verify no new linter/type errors are introduced.
4. Review runtime/performance impact:
   - Avoid unnecessary queries/loops/object allocations.
   - Note complexity or hot-path impact if relevant.
5. Report verification commands and outcomes clearly.

## Minimum Verification Commands (Nx)

- `npx nx build <affected-project>`
- `npx nx test <affected-project>`
- `npx nx lint <affected-project>` (if target exists)

If a target is missing, state it explicitly and provide the nearest equivalent check.

## Output Format

When finishing work, include:

- What changed
- Quality checks run
- Test status
- Performance notes (or "no meaningful impact")
