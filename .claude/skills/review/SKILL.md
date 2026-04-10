---
name: review
description: Review code changes for quality, security, and library best practices. Use when reviewing PRs, checking implementation quality, or auditing code.
---

# Code Review Checklist

## API Design
- [ ] Function signature is intuitive and minimal
- [ ] Return types are predictable (boolean for success/fail, null for "no data")
- [ ] No unnecessary options — only add what users need NOW
- [ ] Error codes are typed and documented

## Bundle Impact
- [ ] No new dependencies added
- [ ] Tree-shaking verified (run `pnpm build` and check output)
- [ ] Bundle size delta < 200B gzip

## TypeScript
- [ ] No `any` types
- [ ] No `as` type assertions without comment explaining why
- [ ] Generics have meaningful constraints
- [ ] Exported types are documented with TSDoc

## Security
- [ ] No eval, innerHTML, or dynamic script injection
- [ ] Feature detection before API access
- [ ] Secure context checks where required (HTTPS)
- [ ] SSR guard: `typeof navigator !== 'undefined'`
- [ ] No sensitive data in console.log

## Testing
- [ ] Unit tests cover: success, failure, unsupported, edge cases
- [ ] E2E test for real browser behavior (if applicable)
- [ ] No flaky tests — deterministic assertions only
- [ ] Coverage maintained at 100% for core functions