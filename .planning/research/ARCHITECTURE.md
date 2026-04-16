# Architecture Research

**Domain:** Rich clipboard integration into existing browser utilities library
**Researched:** 2026-04-16
**Confidence:** HIGH

## The Core Question: Flat clipboard/ vs Subfolders

**Recommendation: Keep all clipboard functions in a single flat `src/clipboard/` folder. Do NOT create subfolders like `src/clipboard/rich/`.**

### Rationale

1. **The clipboard/ folder exists because ctc is a browser utilities library, not a clipboard-only library.** The `src/clipboard/` subfolder is a domain module boundary -- it anticipates `src/storage/`, `src/media/`, `src/dom/` as peers. This is correct architecture. When future modules arrive, each gets its own top-level directory under `src/`.

2. **Rich clipboard functions are clipboard operations, not a separate domain.** `copyRichContent()` and `readRichContent()` use the same browser API family (`navigator.clipboard.write()` / `.read()`), the same secure context requirements, the same error codes, and the same options pattern. They belong alongside `copyToClipboard()` and `readFromClipboard()` -- not in a subfolder.

3. **The existing pattern is one-function-per-file, not one-feature-per-folder.** `copy.ts` has `copyToClipboard`, `read.ts` has `readFromClipboard`, `detect.ts` has detection functions. Rich functions follow this pattern: `copy-rich.ts` has `copyRichContent`, `read-rich.ts` has `readRichContent`. This preserves maximum tree-shaking granularity.

4. **Subfolders would break the subpath export pattern.** The core package exports `"./clipboard"` mapping to `src/clipboard/index.ts`. Adding `src/clipboard/rich/` would either: (a) require a new subpath export `"./clipboard/rich"` -- unnecessary complexity for 2 functions, or (b) roll everything up through the same barrel -- making the subfolder pointless.

5. **Precedent in the codebase:** The Svelte adapter has `action/`, `runes/`, `stores/` subfolders -- but those exist because they are separate *subpath exports* with different build requirements (runes needs uncompiled `.svelte.ts` source). Rich clipboard has no such requirement.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Framework Adapters                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ ctc-react    │  │ ctc-vue      │  │ ctc-svelte           │  │
│  │ useRichCopy  │  │ useRichCopy  │  │ richCopyAction       │  │
│  │ useRichPaste │  │ useRichPaste │  │ useRichCopy (runes)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
├─────────┴─────────────────┴──────────────────────┴──────────────┤
│                      @ngockhoi96/ctc (core)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/clipboard/                                            │   │
│  │   copy.ts        — copyToClipboard (writeText)            │   │
│  │   copy-rich.ts   — copyRichContent (write + ClipboardItem)│   │
│  │   read.ts        — readFromClipboard (readText)           │   │
│  │   read-rich.ts   — readRichContent (read + ClipboardItem) │   │
│  │   detect.ts      — isClipboardSupported + isRichSupported │   │
│  │   fallback.ts    — copyToClipboardLegacy (execCommand)    │   │
│  │   types.ts       — ClipboardOptions, RichClipboardContent │   │
│  │   index.ts       — barrel re-exports                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/lib/                                                  │   │
│  │   env.ts    — isBrowser(), isSecureContext()               │   │
│  │   errors.ts — createError(), handleError()                 │   │
│  │   types.ts  — ErrorCode, BrowserUtilsError, OnErrorCallback│   │
│  └──────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     Browser APIs (Runtime)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Clipboard API    │  │ ClipboardItem    │  │ Blob API     │  │
│  │ writeText/       │  │ constructor      │  │ text/html    │  │
│  │ readText         │  │ getType/types    │  │ text/plain   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Recommended Project Structure

### Core Package (packages/core)

```
src/
├── clipboard/
│   ├── copy.ts               # copyToClipboard() — EXISTING, no changes
│   ├── copy-rich.ts          # copyRichContent() — NEW
│   ├── read.ts               # readFromClipboard() — EXISTING, no changes
│   ├── read-rich.ts          # readRichContent() — NEW
│   ├── detect.ts             # isClipboardSupported() — EXISTING + isRichClipboardSupported() NEW
│   ├── fallback.ts           # copyToClipboardLegacy() — EXISTING, no changes
│   ├── types.ts              # ClipboardOptions — EXISTING + RichClipboardContent, RichClipboardOptions NEW
│   └── index.ts              # barrel — MODIFIED to add new exports
├── lib/
│   ├── env.ts                # EXISTING, no changes
│   ├── errors.ts             # EXISTING, no changes
│   └── types.ts              # MODIFIED to add new error codes
└── index.ts                  # MODIFIED to re-export new functions
```

### What Changes vs What Stays

| File | Status | Change Description |
|------|--------|--------------------|
| `src/clipboard/copy.ts` | UNCHANGED | Plain text copy stays as-is |
| `src/clipboard/read.ts` | UNCHANGED | Plain text read stays as-is |
| `src/clipboard/fallback.ts` | UNCHANGED | Legacy fallback stays as-is |
| `src/clipboard/detect.ts` | MODIFIED | Add `isRichClipboardSupported()` function |
| `src/clipboard/types.ts` | MODIFIED | Add `RichClipboardContent`, `RichClipboardOptions` types |
| `src/clipboard/index.ts` | MODIFIED | Add new exports to barrel |
| `src/clipboard/copy-rich.ts` | NEW | `copyRichContent(html, plainText?, options?)` |
| `src/clipboard/read-rich.ts` | NEW | `readRichContent(options?)` |
| `src/lib/types.ts` | MODIFIED | Add `RICH_CLIPBOARD_NOT_SUPPORTED` error code |
| `src/lib/errors.ts` | MODIFIED | Add new error code to expected set if needed |
| `src/index.ts` | MODIFIED | Re-export new functions (auto from barrel) |

### Structure Rationale

- **`copy-rich.ts` as a separate file from `copy.ts`:** The plain text path uses `writeText()` (simple string). The rich path uses `new ClipboardItem()` + `navigator.clipboard.write()` (Blob construction). These are different enough browser APIs that they should not share a function body. Separate files mean consumers who only use `copyToClipboard` never pay for `Blob`/`ClipboardItem` code.
- **`read-rich.ts` as a separate file from `read.ts`:** Same principle. `readText()` returns a string directly. `read()` returns `ClipboardItem[]` requiring MIME type iteration and Blob-to-text conversion. Different complexity, different code paths.
- **No subfolder:** The clipboard/ directory stays flat with 8 files (6 existing + 2 new). This is a manageable size. Subfolders are warranted at 15+ files or when build requirements differ -- neither applies here.

## Architectural Patterns

### Pattern 1: Dual-MIME ClipboardItem Construction

**What:** When copying rich content, always include both `text/html` AND `text/plain` representations in a single `ClipboardItem`. This ensures paste targets that don't support HTML still get the plain text.
**When to use:** Every `copyRichContent` call.
**Trade-offs:** Slightly more code than HTML-only, but guarantees universal paste compatibility.

**Example:**
```typescript
export async function copyRichContent(
  html: string,
  plainText?: string,
  options?: RichClipboardOptions,
): Promise<boolean> {
  // ... guards (isBrowser, isSecureContext, ClipboardItem check) ...

  const htmlBlob = new Blob([html], { type: 'text/html' })
  const textBlob = new Blob([plainText ?? stripHtml(html)], { type: 'text/plain' })

  const item = new ClipboardItem({
    'text/html': htmlBlob,
    'text/plain': textBlob,
  })

  try {
    await navigator.clipboard.write([item])
    return true
  } catch (error) {
    handleError(createError('CLIPBOARD_WRITE_FAILED', '...', error), options?.onError)
    return false
  }
}
```

### Pattern 2: Structured Rich Content Return Type

**What:** `readRichContent` returns a typed object with `html` and `text` fields (both nullable), not raw `ClipboardItem[]`. This matches the library's philosophy of wrapping browser complexity behind clean interfaces.
**When to use:** The `readRichContent` function.
**Trade-offs:** Consumers who need raw ClipboardItem access for image/binary data would need a different function (future scope). For HTML+text use cases, this is the right abstraction.

**Example:**
```typescript
export interface RichClipboardContent {
  /** HTML content from clipboard, or null if not available */
  html: string | null
  /** Plain text content from clipboard, or null if not available */
  text: string | null
}

export async function readRichContent(
  options?: ClipboardOptions,
): Promise<RichClipboardContent | null> {
  // ... guards ...

  try {
    const items = await navigator.clipboard.read()
    let html: string | null = null
    let text: string | null = null

    for (const item of items) {
      if (item.types.includes('text/html') && html === null) {
        const blob = await item.getType('text/html')
        html = await blob.text()
      }
      if (item.types.includes('text/plain') && text === null) {
        const blob = await item.getType('text/plain')
        text = await blob.text()
      }
    }

    return { html, text }
  } catch (error) {
    // ... error handling ...
    return null
  }
}
```

### Pattern 3: Guard for ClipboardItem API Availability

**What:** Rich clipboard functions need an additional guard beyond what `isSecureContext()` checks. `ClipboardItem` constructor and `navigator.clipboard.write()` are newer APIs not available in all browsers that support `writeText()`.
**When to use:** Every rich clipboard function.
**Trade-offs:** Adds one more guard step, but prevents cryptic errors in browsers that support plain text clipboard but not ClipboardItem.

**Example:**
```typescript
// In detect.ts — new exported function
export function isRichClipboardSupported(): boolean {
  return (
    isBrowser() &&
    isSecureContext() &&
    typeof navigator.clipboard?.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  )
}

// In copy-rich.ts — guard usage
if (typeof ClipboardItem === 'undefined') {
  handleError(
    createError('RICH_CLIPBOARD_NOT_SUPPORTED', 'ClipboardItem API not available'),
    options?.onError,
  )
  return false
}
```

## Data Flow

### Rich Copy Operation Flow

```
Consumer calls copyRichContent(html, plainText?, options?)
    |
    v
[Guard: isBrowser()] --NO--> handleError() --> return false
    |YES
    v
[Guard: isSecureContext()] --NO--> handleError() --> return false
    |YES
    v
[Guard: ClipboardItem exists?] --NO--> handleError() --> return false
    |YES
    v
[Guard: navigator.clipboard.write exists?] --NO--> handleError() --> return false
    |YES
    v
[Construct Blob('text/html') + Blob('text/plain')]
    |
    v
[new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })]
    |
    v
[Try: navigator.clipboard.write([item])]
    |               |
    |SUCCESS        |CATCH (NotAllowedError / other)
    v               v
return true     handleError() --> return false
```

### Rich Read Operation Flow

```
Consumer calls readRichContent(options?)
    |
    v
[Guards: isBrowser, isSecureContext, clipboard.read exists]
    |
    v
[Try: navigator.clipboard.read()] --> ClipboardItem[]
    |
    v
[For each item: check item.types]
    |
    +--> 'text/html' present? --> item.getType('text/html') --> blob.text() --> html
    |
    +--> 'text/plain' present? --> item.getType('text/plain') --> blob.text() --> text
    |
    v
return { html, text } or null on error
```

### Framework Adapter Data Flow

```
Adapter hook/composable/action
    |
    +--> Imports copyRichContent / readRichContent from @ngockhoi96/ctc
    |
    +--> Wraps with framework-specific reactive state
    |    (React: useState, Vue: shallowRef, Svelte: $state)
    |
    +--> Manages copied/error/reset lifecycle (same pattern as plain text)
    |
    +--> Returns { copyRich, pasteRich, copied, error, reset }
```

## Framework Adapter Integration

### What Changes Per Adapter

Each adapter needs rich clipboard hooks/composables that follow the exact same pattern as the existing `useCopyToClipboard` -- state management wrapper around a core function.

#### React (packages/react)

| File | Status | Description |
|------|--------|-------------|
| `src/use-copy-rich-content.ts` | NEW | `useCopyRichContent(initHtml?, initText?, options?)` hook |
| `src/use-read-rich-content.ts` | NEW | `useReadRichContent(options?)` hook |
| `src/index.ts` | MODIFIED | Add new exports |

**Key design decision:** Separate hooks for rich copy and rich read, matching the core API separation. Do NOT merge plain text and rich into a single mega-hook. Each hook stays focused, composable, and tree-shakeable.

#### Vue (packages/vue)

| File | Status | Description |
|------|--------|-------------|
| `src/use-copy-rich-content.ts` | NEW | `useCopyRichContent()` composable |
| `src/use-read-rich-content.ts` | NEW | `useReadRichContent()` composable |
| `src/index.ts` | MODIFIED | Add new exports |

Same pattern: `shallowRef` for `copied`/`error`, plain variable for timer.

#### Svelte (packages/svelte)

| File | Status | Description |
|------|--------|-------------|
| `src/action/copy-rich-action.ts` | NEW | `copyRichAction` Svelte action |
| `src/runes/use-copy-rich-content.svelte.ts` | NEW | Runes-based rich copy |
| `src/stores/use-copy-rich-content.ts` | NEW | Store-based rich copy |
| `src/index.ts` | MODIFIED | Add action export |
| `tsdown.config.ts` | UNCHANGED | Runes/stores entries already handle subpath pattern |

**Svelte-specific note:** The runes entry uses uncompiled `.svelte.ts` source via the `svelte` export condition. New runes files follow this same pattern -- they are included in the `src/runes/` directory, and the tsdown entry for `runes` should expand to include them (or use a barrel within `src/runes/`).

### Adapter Pattern: Parallel, Not Sequential

Rich clipboard adapters do NOT depend on plain text adapters at code level. They independently import from `@ngockhoi96/ctc`. Build order:

```
@ngockhoi96/ctc (core) — build first, includes both plain + rich
    |
    +--> @ngockhoi96/ctc-react   — builds independently
    +--> @ngockhoi96/ctc-vue     — builds independently
    +--> @ngockhoi96/ctc-svelte  — builds independently
```

This is already how Turborepo handles it via `dependsOn: ["^build"]`.

## Build Configuration Changes

### Core tsdown.config.ts

No changes needed. The rich clipboard functions are added to `src/clipboard/` and exported through the existing `src/clipboard/index.ts` barrel. The existing entry points remain:

```typescript
entry: {
  index: 'src/index.ts',
  'clipboard/index': 'src/clipboard/index.ts',
}
```

Consumers importing from `@ngockhoi96/ctc` or `@ngockhoi96/ctc/clipboard` automatically get access to `copyRichContent` and `readRichContent`. Tree-shaking ensures unused functions are eliminated.

### Size Budget

The rich clipboard functions add `ClipboardItem` construction and `Blob` creation -- both are browser globals with zero import cost. The new code is ~40-60 lines per function (similar to existing copy/read functions). Expected impact:

| Entry Point | Current Budget | Expected After |
|-------------|---------------|----------------|
| `dist/index.mjs` | < 1KB | < 1KB (tree-shakeable, consumers import what they use) |
| `dist/clipboard/index.mjs` | < 1KB | ~1.2KB (all clipboard functions bundled together) |

If the clipboard subpath exceeds 1KB, increase the size-limit for `dist/clipboard/index.mjs` to 1.5KB. The root entry stays under 1KB because bundlers tree-shake unused exports.

## Error Code Changes

Add to `ErrorCode` union in `src/lib/types.ts`:

```typescript
export type ErrorCode =
  | 'CLIPBOARD_NOT_SUPPORTED'
  | 'CLIPBOARD_PERMISSION_DENIED'
  | 'CLIPBOARD_WRITE_FAILED'
  | 'CLIPBOARD_READ_FAILED'
  | 'INSECURE_CONTEXT'
  | 'RICH_CLIPBOARD_NOT_SUPPORTED'  // NEW: ClipboardItem API unavailable
```

**Decision: One new error code, not many.** `RICH_CLIPBOARD_NOT_SUPPORTED` covers the case where `ClipboardItem` or `clipboard.write()` is absent. Write/read failures reuse the existing `CLIPBOARD_WRITE_FAILED` and `CLIPBOARD_READ_FAILED` codes -- the failure mechanism is the same, just the operation differs.

Add `RICH_CLIPBOARD_NOT_SUPPORTED` to the `EXPECTED_ERROR_CODES` set in `src/lib/errors.ts` since it represents an environment limitation, not an unexpected failure.

## Anti-Patterns

### Anti-Pattern 1: Merging Rich and Plain Functions

**What people do:** Add an `options.rich` flag to `copyToClipboard()` or overload its signature to accept HTML.
**Why it's wrong:** Breaks the existing API contract. Forces all consumers to deal with the more complex `ClipboardItem` API even when they only need plain text. Makes the function signature confusing and the implementation harder to test.
**Do this instead:** Separate functions: `copyToClipboard(text)` for plain, `copyRichContent(html, text?)` for rich. Clean, independent, tree-shakeable.

### Anti-Pattern 2: Creating a clipboard/rich/ Subfolder

**What people do:** Add `src/clipboard/rich/copy.ts`, `src/clipboard/rich/read.ts`, `src/clipboard/rich/types.ts`.
**Why it's wrong:** Creates a false hierarchy. Rich clipboard is not a sub-domain of clipboard -- it is clipboard. The subfolder adds import path complexity, potential barrel file issues, and confusing navigation between "is this the plain or rich folder?" for contributors. It also tempts adding a `"./clipboard/rich"` subpath export that nobody needs.
**Do this instead:** Keep flat: `copy-rich.ts` and `read-rich.ts` in `src/clipboard/`. The `-rich` suffix is sufficient disambiguation.

### Anti-Pattern 3: HTML Sanitization in the Library

**What people do:** Sanitize or validate HTML before copying to clipboard.
**Why it's wrong:** This is a zero-dependency library. DOMPurify or similar adds runtime weight. HTML sanitization is the consumer's responsibility -- the library's job is to faithfully copy what it receives.
**Do this instead:** Document that consumers should sanitize HTML before passing it to `copyRichContent()`. The function copies exactly what it receives.

### Anti-Pattern 4: Returning Raw ClipboardItem from readRichContent

**What people do:** Return `ClipboardItem[]` directly and let consumers parse MIME types.
**Why it's wrong:** Defeats the purpose of the library (simple API over complex browser APIs). Consumers would need to know about `getType()`, `Blob.text()`, MIME type strings -- exactly the complexity this library abstracts.
**Do this instead:** Return `{ html: string | null, text: string | null }`. Clean, typed, no browser API knowledge required.

## Suggested Build Order

For the v0.4.0 milestone, implement in this order:

1. **Types first:** Add `RichClipboardContent`, `RichClipboardOptions`, new error code to `src/lib/types.ts` and `src/clipboard/types.ts`
2. **Detection:** Add `isRichClipboardSupported()` to `src/clipboard/detect.ts`
3. **Core write:** Implement `src/clipboard/copy-rich.ts` with unit tests
4. **Core read:** Implement `src/clipboard/read-rich.ts` with unit tests
5. **Barrel exports:** Update `src/clipboard/index.ts` and `src/index.ts`
6. **E2E tests:** Add rich clipboard E2E tests to `tests/e2e/clipboard.spec.ts`
7. **Adapters (parallel):** React, Vue, Svelte rich clipboard hooks/composables/actions
8. **Size validation:** Run `pnpm size` and adjust budgets if needed

## Sources

- [MDN: Clipboard.write()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/write) - ClipboardItem API for writing arbitrary MIME types (Context7 verified, HIGH confidence)
- [MDN: Clipboard.read()](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/read) - Reading ClipboardItem objects with MIME type iteration (Context7 verified, HIGH confidence)
- [MDN: ClipboardItem constructor](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem) - Blob-based MIME type mapping (Context7 verified, HIGH confidence)
- Existing codebase analysis: `packages/core/src/clipboard/`, `packages/react/`, `packages/vue/`, `packages/svelte/` (direct inspection, HIGH confidence)
- Existing tsdown config and package.json exports patterns (direct inspection, HIGH confidence)

---
*Architecture research for: Rich clipboard integration into @ngockhoi96/ctc*
*Researched: 2026-04-16*
