---
name: implement
description: Implement a new browser utility function. Use when adding new API functions to the library, creating new modules, or extending existing modules with new exports.
---

# Implement New Utility

## Checklist
1. Create source file in appropriate module directory (e.g., src/clipboard/)
2. Add types to types.ts in the module
3. Implement function with:
   - Input validation
   - Feature detection (isSupported check)
   - Try/catch with typed error codes
   - TSDoc comment with @example
4. Export from module's index.ts barrel
5. Export from root src/index.ts
6. Write unit tests covering: success, failure, unsupported, edge cases
7. Run `pnpm test` — must pass
8. Run `pnpm build` — verify output includes new export
9. Run `pnpm validate` — verify package exports resolve correctly
10. Run `pnpm size` — verify bundle size delta is acceptable

## Function Template
```typescript
/**
 * Brief description of what this does.
 *
 * @param param - Description
 * @returns Description of return value
 *
 * @example
 * ```ts
 * const result = await myFunction('input');
 * ```
 */
export async function myFunction(input: string): Promise<boolean> {
  if (!isMyApiSupported()) {
    console.warn('MyAPI is not supported in this browser');
    return false;
  }

  try {
    // implementation
    return true;
  } catch (error) {
    console.error('myFunction failed:', error);
    return false;
  }
}
```