Analyze the current bundle output:

1. Run `pnpm build`
2. Run `pnpm size` and report the results
3. Run `pnpm validate` (publint + attw)
4. List all exports and their individual sizes if possible
5. Verify tree-shaking: create a temp file that imports only one function, bundle it with tsdown, and confirm other functions are excluded from output
6. Clean up temp files
7. Report summary: total size, per-export size, any validation issues