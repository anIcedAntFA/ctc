---
phase: 08
reviewed: 2026-04-14T07:44:41Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - README.md
  - packages/core/README.md
  - CONTRIBUTING.md
  - SECURITY.md
  - .github/PULL_REQUEST_TEMPLATE.md
  - .github/ISSUE_TEMPLATE/bug_report.md
  - .github/ISSUE_TEMPLATE/feature_request.md
  - .github/ISSUE_TEMPLATE/config.yml
  - .changeset/changelog.cjs
  - .changeset/config.json
  - packages/react/README.md
  - packages/vue/README.md
  - packages/svelte/README.md
status: issues_found
severity_counts:
  critical: 0
  high: 1
  medium: 1
  low: 1
  info: 1
---

# Phase 08 Code Review

**Reviewed:** 2026-04-14T07:44:41Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Phase 08 delivers 13 documentation and release-infrastructure files. The majority are clean:
SECURITY.md routes correctly to GitHub private vulnerability reporting with no email leakage;
all YAML frontmatter in issue templates is well-formed; the `changelog.cjs` module exports the
correct `ChangelogFunctions` shape, uses `require('@changesets/changelog-github').default`
correctly (verified at runtime), and the emoji injection regex behaves as documented.
`config.json` schema URL and changelog array format are valid.

Two actionable issues were found. One high-severity typo in the CI badge URL in `README.md`
will produce a broken badge link pointing to a non-existent repository. One medium-severity
relative path issue in the PR template will produce a broken link when the template is
rendered on GitHub.

---

## Findings

### [HIGH] README.md: CI badge URL contains typo `cttc` — broken badge link

**File:** `README.md:7`

**Issue:** The CI badge `src` URL and its surrounding `href` both reference
`https://github.com/anIcedAntFA/cttc/...` (note the extra `t`). The actual repository is
`anIcedAntFA/ctc`. The badge image will return a 404 from GitHub and the link navigates to
a non-existent repository. All other badge URLs on the same lines are correct.

```markdown
# Current (broken):
[![CI](https://github.com/anIcedAntFA/cttc/actions/workflows/ci.yml/badge.svg)](https://github.com/anIcedAntFA/cttc/actions/workflows/ci.yml)

# Fix:
[![CI](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml/badge.svg)](https://github.com/anIcedAntFA/ctc/actions/workflows/ci.yml)
```

---

### [MEDIUM] .github/PULL_REQUEST_TEMPLATE.md: relative link to CONTRIBUTING.md is broken

**File:** `.github/PULL_REQUEST_TEMPLATE.md:30`

**Issue:** The link `[CONTRIBUTING.md](./CONTRIBUTING.md#creating-a-changeset)` uses a path
relative to the template's own directory (`.github/`). That resolves to
`.github/CONTRIBUTING.md`, which does not exist. `CONTRIBUTING.md` lives at the repository
root. GitHub renders PR body template links relative to the file's location in the
repository tree, so contributors clicking the link from the PR form will hit a 404.

```markdown
# Current (broken):
See [CONTRIBUTING.md](./CONTRIBUTING.md#creating-a-changeset)

# Fix:
See [CONTRIBUTING.md](../CONTRIBUTING.md#creating-a-changeset)
```

---

### [LOW] CONTRIBUTING.md: "independent mode" is lerna terminology not reflected in config.json

**File:** `CONTRIBUTING.md:88`

**Issue:** The release flow section describes changesets as running in "independent mode."
Changesets does not use the concept of a named "independent mode" — that terminology comes
from Lerna's `version: independent` configuration. The `config.json` has no corresponding
setting; changesets versions packages individually by default based on which packages each
changeset targets. Readers familiar with Lerna who look for a corresponding config field
will not find one, and may incorrectly believe a configuration step was missed.

**Fix:** Replace "independent mode" with language that describes the actual behavior:

```markdown
# Current:
This repo uses [changesets](https://github.com/changesets/changesets) in **independent mode** — each package versions and publishes separately.

# Fix (suggested):
This repo uses [changesets](https://github.com/changesets/changesets). Each package is versioned and published separately — a single changeset targets only the packages it affects.
```

---

### [INFO] .changeset/changelog.cjs: silent passthrough on upstream format change

**File:** `.changeset/changelog.cjs:31`

**Issue:** The emoji injection regex `/^(\n\n- )/` matches against the string start. If the
upstream `@changesets/changelog-github` package changes its output format (e.g., leading
newlines differ), the `replace()` call will silently no-op and entries will be emitted
without an emoji prefix. There is no warning or test fixture that guards this contract.

This is not a correctness bug in the current version (the format is stable and the
`if (!emoji) return line` guard handles unknown bump types), but it is worth noting as a
fragility point for future maintainers. Adding a unit test for the formatter with a fixture
of the upstream output format would make the contract explicit.

No immediate code change required.

---

## Clean Files

The following files were reviewed and have no issues:

- `packages/core/README.md` — API reference complete, relative paths (`../../README.md#browser-support`, `../../LICENSE`) resolve correctly, all five functions documented.
- `SECURITY.md` — No email addresses; routes correctly to GitHub private vulnerability reporting (`/security/advisories/new`); 72-hour SLA stated; all four packages listed in supported versions table.
- `.github/ISSUE_TEMPLATE/bug_report.md` — YAML frontmatter well-formed (starts with `---`), all required fields present, environment section comprehensive.
- `.github/ISSUE_TEMPLATE/feature_request.md` — YAML frontmatter well-formed, three required sections present.
- `.github/ISSUE_TEMPLATE/config.yml` — `blank_issues_enabled: false` set, Discussions link correct.
- `.changeset/changelog.cjs` — `require('@changesets/changelog-github').default` usage verified correct at runtime. `module.exports` shape `{ getReleaseLine, getDependencyReleaseLine }` matches `ChangelogFunctions` interface. Emoji map matches `VersionType` values; `"none"` type silently passes through (correct).
- `.changeset/config.json` — `$schema` URL valid format, `changelog` array format `["./changelog.cjs", { "repo": "..." }]` is correct for changesets config. `access: "public"`, `baseBranch: "master"` correct.
- `CONTRIBUTING.md` — All referenced commands (`pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm validate`, `pnpm changeset`, `pnpm setup`) are present in root `package.json`. Emoji table matches `changelog.cjs` EMOJI_BY_TYPE map. Filter commands use correct package names.
- `packages/react/README.md` — "See also" links (`../core/README.md`, `../vue/README.md`, `../svelte/README.md`) all resolve to existing files.
- `packages/vue/README.md` — "See also" links (`../core/README.md`, `../react/README.md`, `../svelte/README.md`) all resolve to existing files.
- `packages/svelte/README.md` — "See also" links (`../core/README.md`, `../react/README.md`, `../vue/README.md`) all resolve to existing files.

---

_Reviewed: 2026-04-14T07:44:41Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
