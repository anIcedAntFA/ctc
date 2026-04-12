---
"@ngockhoi96/ctc": patch
---

Fix `exports` map missing `types` condition for TypeScript consumers.

TypeScript consumers using `moduleResolution: nodenext` or `bundler` now correctly resolve declarations via the `"types"` condition in the `exports` map for both the root `"."` and `"./clipboard"` subpath, instead of falling back to the CJS `.d.cts` file.
