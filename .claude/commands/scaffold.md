Scaffold a new utility module named $ARGUMENTS in the src/ directory.

Create:
1. src/$ARGUMENTS/index.ts (barrel export)
2. src/$ARGUMENTS/types.ts (shared types for this module)
3. src/$ARGUMENTS/$ARGUMENTS.ts (main implementation with empty function stubs based on the spec)
4. tests/unit/$ARGUMENTS.test.ts (test skeleton with describe blocks)
5. Update src/index.ts to re-export from the new module

Then run `pnpm build` to verify it compiles cleanly.
Report any issues.