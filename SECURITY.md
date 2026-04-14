# Security Policy

## Supported Versions

Only the latest published version of each package receives security updates. Older
versions are not patched.

| Package                  | Supported |
|--------------------------|-----------|
| `@ngockhoi96/ctc`        | ✅ latest |
| `@ngockhoi96/ctc-react`  | ✅ latest |
| `@ngockhoi96/ctc-vue`    | ✅ latest |
| `@ngockhoi96/ctc-svelte` | ✅ latest |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security reports.**

This repository uses GitHub's private vulnerability reporting. To report a security
issue:

1. Go to the [Security tab](https://github.com/anIcedAntFA/ctc/security) of this
   repository.
2. Click **Report a vulnerability** (or use the direct link:
   [Report a vulnerability](https://github.com/anIcedAntFA/ctc/security/advisories/new)).
3. Fill in the advisory form with:
   - A clear description of the vulnerability
   - Steps to reproduce
   - Affected package(s) and version(s)
   - A proof-of-concept (if possible)
   - A suggested fix (if you have one)

## What to expect

- You will receive an acknowledgment within **72 hours** of submission.
- The maintainer will investigate and confirm the vulnerability privately.
- Fixes are developed, reviewed, and released under a GitHub Security Advisory before
  public disclosure.
- Once a patch ships, the advisory is published and credit is given to the reporter
  (unless anonymity is requested).

## Scope

This policy covers the published npm packages in this repository:
`@ngockhoi96/ctc`, `@ngockhoi96/ctc-react`, `@ngockhoi96/ctc-vue`, and
`@ngockhoi96/ctc-svelte`. It does not cover the playgrounds (`playground/*`), which
are demo apps and not published to npm.
