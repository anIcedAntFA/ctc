# Phase 1: Project Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 01-project-foundation
**Areas discussed:** TypeScript setup, Entry points, Source layout, Git workflow, Biome config, Bundle validation, Changesets setup

---

## TypeScript Setup

| Option | Description | Selected |
|--------|-------------|----------|
| TS 6.0 (Recommended) | Latest, isolatedDeclarations stable. Fall back to 5.8 if tools break. | ✓ |
| TS 5.8 (Safe) | Proven stable with tsdown. Upgrade later. | |
| You decide | Claude picks based on what works during setup | |

**User's choice:** TS 6.0 with fallback to 5.8
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes (Recommended) | Fast .d.ts via Oxc, enforces explicit return types | ✓ |
| No | Use standard tsc for declarations | |

**User's choice:** Yes — isolatedDeclarations enabled
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Maximum strict | strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes | ✓ |
| Standard strict | Just strict: true | |
| You decide | Claude picks appropriate strictness | |

**User's choice:** Maximum strict
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| ES2020 (as planned) | >95% global browser support | ✓ |
| ES2022 | Adds top-level await, Error.cause | |
| ESNext | Latest features, narrower support | |

**User's choice:** ES2020
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Node 20 (Recommended) | Current LTS, EOL April 2026 | ✓ |
| Node 22 | Latest LTS, EOL April 2027 | |

**User's choice:** Node 20
**Notes:** None

---

## Entry Points

| Option | Description | Selected |
|--------|-------------|----------|
| Both from day 1 (Recommended) | Validates exports map early | ✓ |
| Root only first | Start simple, add subpath later | |
| You decide | Claude picks | |

**User's choice:** Both entry points from day 1
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generate | tsdown exports: true | ✓ |
| Handwrite | Manual exports map | |
| You decide | Claude picks | |

**User's choice:** Auto-generate via tsdown
**Notes:** None

---

## Source Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Skeleton files (Recommended) | Create src/clipboard/ with placeholders for full pipeline validation | ✓ |
| Tooling only | Only config files, no src/ | |
| Minimal src/index.ts | Just root entry point | |

**User's choice:** Skeleton files
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Include utils skeleton | env.ts, errors.ts, types.ts | ✓ |
| Defer to Phase 2 | Create alongside clipboard implementation | |

**User's choice:** Include utils skeleton in Phase 1
**Notes:** None

---

## Git Workflow

**Pre-commit hooks (multiSelect):**
- ✓ Biome lint
- ✓ Biome format
- ✓ Type check
- ✓ Unit tests

**Pre-push hooks (multiSelect):**
- ✓ Full build
- ✓ Validate (publint + attw)
- ✓ All tests

| Option | Description | Selected |
|--------|-------------|----------|
| @commitlint/config-conventional (Recommended) | Standard preset | ✓ |
| Custom config | Define own types | |
| You decide | Claude picks | |

**User's choice:** Standard conventional commits preset
**Notes:** None

---

## Biome Config

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs, single quotes | Tabs, single quotes, 80 char width | ✓ |
| Spaces (2), single quotes | 2-space, single quotes | |
| Spaces (2), double quotes | 2-space, double quotes | |
| Let me specify | Custom | |

**User's choice:** Tabs, single quotes
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Recommended + nursery | Standard + experimental rules | ✓ |
| Recommended only | Only stable rules | |
| All rules on | Maximum coverage | |

**User's choice:** Recommended + nursery
**Notes:** None

---

## Bundle Validation

| Option | Description | Selected |
|--------|-------------|----------|
| 1KB gzip (from PRD) | Tight but achievable | ✓ |
| 500B gzip | Even tighter | |
| 2KB gzip | More headroom | |

**User's choice:** 1KB gzip
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Block CI (Recommended) | Failures fail the PR | ✓ |
| Warn only | Report but don't block | |

**User's choice:** Block CI
**Notes:** None

---

## Changesets Setup

| Option | Description | Selected |
|--------|-------------|----------|
| 0.x.y standard (Recommended) | Breaking at minor, patches at patch | ✓ |
| Start at 1.0.0 | Strict semver from day one | |

**User's choice:** 0.x.y standard
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Public | Public npm registry | ✓ |
| Restricted | Scoped, restricted access | |

**User's choice:** Public
**Notes:** None

---

## Claude's Discretion

- Exact tsdown config options beyond entry points and exports
- Biome nursery rule selection
- tsconfig paths and non-critical compiler options
- Lefthook parallel vs sequential execution
- Changeset commit message format

## Deferred Ideas

None — discussion stayed within phase scope
