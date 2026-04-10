# Testing Rules

## Unit Tests (Vitest)
- File naming: `{module}.test.ts` co-located with source
- Use `describe` blocks grouped by function
- AAA pattern: Arrange → Act → Assert
- Mock browser APIs at module level, restore in afterEach
- Test error paths explicitly — happy path is not enough

## E2E Tests (Playwright)
- File naming: `{feature}.spec.ts` in tests/e2e/
- Each test must be independent — no shared state
- Test across Chromium, Firefox, WebKit
- Use page.evaluate() for clipboard operations

## Coverage
- Core functions: 100% line + branch coverage
- Don't chase 100% on barrel files or type-only files
- Run `pnpm test -- --coverage` to check