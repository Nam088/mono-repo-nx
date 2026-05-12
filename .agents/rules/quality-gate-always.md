---
trigger: always_on
glob: **/*
description: Code quality enforcement standards for linting, testing, and building.
---
# Mandatory Quality Gate

For any implementation or refactor, the assistant must:

- Add/update unit tests for changed behavior.
- Run relevant lint/build/test commands for affected projects.
- Fix newly introduced lint/type issues before completion.
- Include a short performance-impact review (queries, loops, allocations, hot paths).
- Report commands executed and results in the final response.

Do not claim completion if verification has not been run or explicitly justified.
