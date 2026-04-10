# PRD: Browser Utilities Library

> **Codename:** `@ngockhoi96` (placeholder — finalize before npm scope registration)
> **Author:** [You]
> **Status:** Draft v1
> **Date:** 2026-04-08

---

## 1. Vision & Goals

### What
A modular, tree-shakeable browser utilities library. Starts with clipboard utilities, designed to scale into storage, media, DOM, and other browser APIs.

### Why
- **Learning:** Deeply understand the JS library lifecycle — bundling, publishing, testing, CI/CD, API design.
- **OSS contribution:** Build something genuinely useful with production-grade quality.

### Non-Goals (for now)
- Server-side utilities (Node-only APIs)
- Polyfills for legacy browsers
- CLI tool (defer until there's a real need)

---

## 2. Architecture

### Phase 1: Single Package

```
@ngockhoi96/core
├── src/
│   ├── clipboard/
│   │   ├── copy.ts              # copyToClipboard()
│   │   ├── read.ts              # readFromClipboard()
│   │   ├── types.ts
│   │   └── index.ts             # barrel export
│   ├── index.ts                 # main entry
│   └── utils/                   # shared internals
├── tests/
│   ├── unit/                    # vitest
│   └── e2e/                     # playwright
├── tsdown.config.ts
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

**Output formats:**
- ESM (primary) — `.mjs`
- CJS (compat) — `.cjs`
- TypeScript declarations — `.d.ts`
- Source maps

### Phase 2: Monorepo (khi cần framework adapters)

```
packages/
├── core/                        # @ngockhoi96/core
├── react/                       # @ngockhoi96/react — useCopyToClipboard()
├── vue/                         # @ngockhoi96/vue — useCopyToClipboard()
└── svelte/                      # @ngockhoi96/svelte (nếu cần)
```

**Monorepo tool:** pnpm workspaces + turborepo (hoặc nx nếu scale lớn).

**Nguyên tắc:** Chỉ tách package khi có user thực sự cần. Đừng tạo `@ngockhoi96/vue` nếu chưa ai dùng Vue.

---

## 3. Tech Stack

| Layer | Tool | Lý do |
|---|---|---|
| Language | TypeScript (strict) | Type safety, DX |
| Bundler | **tsdown** | Built on Rolldown, stable hơn raw Rolldown, học Rolldown internals qua đó |
| Dev server | Vite | Playground/demo site |
| Unit test | Vitest | Fast, Vite-native, ESM-first |
| E2E test | Playwright | Real browser clipboard testing (cần actual browser context) |
| Package manager | pnpm | Fast, strict, workspace support sẵn |
| Linting | Biome | Fast, replace cả ESLint + Prettier |
| CI/CD | GitHub Actions | Standard, free for OSS |
| Docs | VitePress hoặc Starlight | Static site, markdown-based |
| Changeset | changesets | Versioning + changelog tự động |

### Tại sao tsdown thay vì tsup/Rolldown trực tiếp?

- **tsdown:** Wrapper xung quanh Rolldown, API đơn giản kiểu tsup nhưng dùng Rolldown engine bên dưới. Đủ để học Rolldown internals mà không cần deal với alpha API.
- **Rolldown trực tiếp:** Unstable API, phù hợp cho experiment riêng nhưng không nên dùng cho production lib.
- **tsup:** Stable nhưng dùng esbuild — bạn muốn học Rolldown thì tsdown là sweet spot.

---

## 4. Core API Design

### 4.1 Clipboard Module

```ts
// --- Core (framework-agnostic) ---

// Copy text
async function copyToClipboard(text: string): Promise<boolean>

// Copy rich content (HTML, images)
async function copyRichContent(data: ClipboardItemData): Promise<boolean>

// Read text
async function readFromClipboard(): Promise<string | null>

// Read rich content
async function readRichContent(): Promise<ClipboardItems | null>

// Check support
function isClipboardSupported(): boolean
function isClipboardReadSupported(): boolean
```

### 4.2 React Hook (Phase 2)

```ts
function useCopyToClipboard(options?: {
  timeout?: number       // auto-reset hasCopied (default: 2000ms)
  onSuccess?: (text: string) => void
  onError?: (error: Error) => void
}): {
  copiedText: string | null
  hasCopied: boolean
  copy: (text: string) => Promise<boolean>
  reset: () => void
}
```

### 4.3 Design Principles

1. **Promise-based, never throw** — return `boolean` hoặc `null` cho failure, log warning. Caller quyết định handle thế nào.
2. **Zero dependencies** — chỉ dùng browser native APIs.
3. **Tree-shakeable** — mỗi function export riêng, không side effects.
4. **Progressive enhancement** — check API support trước khi gọi, fallback graceful.
5. **Minimal API surface** — ít function, mỗi function làm 1 việc rõ ràng.

---

## 5. Error Handling Strategy

```ts
// Internal error type
interface BrowserUtilsError {
  code: 'CLIPBOARD_NOT_SUPPORTED'
       | 'CLIPBOARD_PERMISSION_DENIED'
       | 'CLIPBOARD_WRITE_FAILED'
       | 'CLIPBOARD_READ_FAILED'
  message: string
  cause?: unknown
}

// Option A: Return boolean/null (simple — default)
const ok = await copyToClipboard('text') // true | false

// Option B: Callback-based error detail (opt-in)
const ok = await copyToClipboard('text', {
  onError: (err: BrowserUtilsError) => {
    // detailed error info khi cần
  }
})
```

**Không throw by default.** Clipboard fail không phải critical error trong hầu hết UX flows.

---

## 6. Edge Cases & Security

| Case | Handling |
|---|---|
| Clipboard API không support | Return `false`, console.warn |
| Permission denied (Permissions API) | Return `false`, surface qua `onError` |
| Gọi ngoài user gesture (Chrome restriction) | Return `false`, document rõ trong docs |
| Empty string input | Cho phép — empty string là valid clipboard content |
| Huge text (>1MB) | Không limit nhưng document performance implications |
| iframe / cross-origin | Respect browser security model, document limitations |
| HTTP (non-HTTPS) | Clipboard API require secure context — detect và warn |
| SSR environments (Next.js, Nuxt) | Guard với `typeof navigator !== 'undefined'` |

---

## 7. Bundle Optimization

### Targets

| Metric | Target |
|---|---|
| Core bundle (minified + gzip) | < 1KB |
| Tree-shaking | Dead code elimination verified |
| Side effects | `"sideEffects": false` in package.json |
| Browser target | ES2020+ (>95% global support) |

### Verification Checklist

- [ ] `bundlephobia` size check in CI
- [ ] `publint` — validate package.json exports
- [ ] `arethetypeswrong` — validate .d.ts correctness
- [ ] `size-limit` — fail CI if bundle exceeds threshold
- [ ] Import map test — verify tree-shaking works in Vite/webpack/Rollup

### package.json exports

```json
{
  "name": "@ngockhoi96/core",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./clipboard": {
      "import": "./dist/clipboard/index.mjs",
      "require": "./dist/clipboard/index.cjs",
      "types": "./dist/clipboard/index.d.ts"
    }
  },
  "sideEffects": false,
  "files": ["dist"],
  "engines": { "node": ">=18" }
}
```

---

## 8. Testing Strategy

### Unit Tests (Vitest)

- Mock `navigator.clipboard` — test logic, error paths, edge cases
- Coverage target: **100%** cho core functions (small surface, no excuse)

```ts
// Ví dụ
describe('copyToClipboard', () => {
  it('returns true on success', async () => { ... })
  it('returns false when API unavailable', async () => { ... })
  it('returns false on permission denied', async () => { ... })
  it('handles empty string', async () => { ... })
  it('calls onError with correct code', async () => { ... })
})
```

### E2E Tests (Playwright)

- Real browser context — verify clipboard actually works
- Test across Chromium, Firefox, WebKit
- Test permission flows
- Test secure context requirement

### CI Test Matrix

```yaml
- os: [ubuntu-latest, macos-latest, windows-latest]
- node: [18, 20, 22]
- browser: [chromium, firefox, webkit]  # E2E only
```

---

## 9. Documentation

### Structure (VitePress)

```
docs/
├── guide/
│   ├── getting-started.md
│   ├── why.md                   # So sánh vs alternatives
│   └── browser-support.md
├── api/
│   ├── clipboard.md             # Auto-gen từ TSDoc
│   └── react.md
├── examples/
│   ├── basic.md
│   ├── with-react.md
│   ├── with-vue.md
│   └── error-handling.md
└── contributing.md
```

### Must-have cho mỗi API

1. **TSDoc comment** đầy đủ trên mỗi export
2. **Live playground** (embed Stackblitz/CodeSandbox)
3. **Copy-paste example** chạy được ngay
4. **Browser support table**
5. **Common pitfalls** section

---

## 10. CI/CD Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PR Check   │───▶│    Build     │───▶│    Test      │───▶│   Validate   │
│  lint, types │    │  tsdown      │    │ vitest + pw  │    │ publint,     │
│              │    │              │    │              │    │ size-limit,  │
│              │    │              │    │              │    │ attw         │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                  │
                                                                  ▼
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  npm publish │◀───│  Create Tag  │◀───│  Changelog   │◀───│  Changeset   │
│              │    │  + Release   │    │  Auto-gen    │    │  Version PR  │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### GitHub Actions Workflows

1. **ci.yml** — Runs on every PR: lint → build → test → validate
2. **release.yml** — On merge to main with changeset: version bump → changelog → publish → GitHub release
3. **docs.yml** — Deploy docs on tag push

### Versioning

- **Semantic Versioning** (semver)
- **@changesets/cli** — manage version bumps qua PR
- Pre-1.0: `0.x.y` — breaking changes ở minor, patches ở patch
- Post-1.0: strict semver

---

## 11. Release Checklist (v0.1.0)

### Must Have
- [ ] `copyToClipboard()` — core function
- [ ] `isClipboardSupported()` — feature detection
- [ ] Unit tests — 100% coverage
- [ ] E2E tests — Chromium + Firefox + WebKit
- [ ] tsdown build — ESM + CJS + .d.ts
- [ ] package.json exports validated (`publint`, `attw`)
- [ ] Bundle size < 1KB gzip
- [ ] CI pipeline (lint + build + test + validate)
- [ ] README with quick start example
- [ ] MIT License
- [ ] npm publish workflow

### Nice to Have (v0.1.0)
- [ ] `readFromClipboard()`
- [ ] `copyRichContent()`
- [ ] VitePress docs site
- [ ] Playground demo

### Phase 2 (v0.2.0+)
- [ ] React hook — `useCopyToClipboard()`
- [ ] Vue composable — `useCopyToClipboard()`
- [ ] Monorepo migration (pnpm workspaces)
- [ ] More browser utility modules

---

## 12. Competitive Analysis

| Library | Size | Framework | Pros | Cons |
|---|---|---|---|---|
| `clipboard-copy` | ~200B | None | Tiny, focused | Write-only, no hooks |
| `copy-to-clipboard` | ~1.5KB | None | Fallback support | Uses deprecated execCommand |
| `@vueuse/core` | Large | Vue | Full ecosystem | Vue-only, huge bundle |
| `usehooks-ts` | Varies | React | Good hooks | React-only |
| **Ours** | <1KB | Agnostic + adapters | Modular, modern, multi-framework | New, unproven |

**Differentiation:** Framework-agnostic core + opt-in framework adapters. Modern API only (no execCommand fallback). Focused on DX and bundle size.

---

## 13. Open Questions

1. **Library name?** Cần pick trước khi publish. Gợi ý: `@webtools/core`, `@butils/core`, hoặc tên riêng ngắn gọn.
2. **npm scope:** Dùng `@scope/package` hay unscoped `package-name`?
3. **execCommand fallback?** Clipboard API require HTTPS + user gesture. Có cần fallback cho edge cases không? (Recommend: không, document limitation thay vì polyfill.)
4. **Minimum browser support?** Recommend ES2020+ nhưng cần confirm.
5. **Monorepo timing?** Trigger khi nào — khi có React adapter hay sớm hơn?

---

## 14. Learning Roadmap

Thứ tự học qua project này:

1. **TypeScript library authoring** — tsconfig, declaration files, strict mode
2. **Bundler internals** — tsdown/Rolldown: chunks, tree-shaking, output formats
3. **Package publishing** — npm, exports map, `files` field, prepublish scripts
4. **Testing** — Vitest (unit), Playwright (E2E), coverage, mocking browser APIs
5. **CI/CD** — GitHub Actions, changesets, automated releases
6. **Bundle analysis** — size-limit, bundlephobia, publint, arethetypeswrong
7. **Documentation** — VitePress/Starlight, TSDoc, live examples
8. **Monorepo** — pnpm workspaces, turborepo, cross-package dependencies
9. **API design** — ergonomics, error contracts, progressive enhancement
10. **OSS maintenance** — issue templates, contributing guide, code of conduct