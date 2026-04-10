# Code Style Rules

## TypeScript
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `const` assertions where possible
- No enums — use const objects with `as const`
- Generic constraints: always provide meaningful defaults

## Naming
- Functions: camelCase, verb-first (copyToClipboard, isSupported)
- Types/Interfaces: PascalCase (ClipboardOptions, BrowserUtilsError)
- Constants: SCREAMING_SNAKE for true constants only
- Files: kebab-case (copy-to-clipboard.ts)

## Exports
- Named exports only, no default exports
- Barrel files (index.ts) re-export from modules
- Every public export must have TSDoc

## Error Handling
- Return boolean/null for expected failures
- Use typed error codes (not string messages) for onError callbacks
- console.warn for "not supported", console.error for unexpected failures
- Never throw unless it's a programmer error (wrong argument type)
