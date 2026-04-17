# Phase 11: Framework Adapters - Pattern Map

**Mapped:** 2026-04-16
**Files analyzed:** 14 (5 new source, 3 new test, 2 new barrel, 2 new fixtures, 3 modified index/config)
**Analogs found:** 14 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages/react/src/use-copy-rich-content.ts` | hook | request-response | `packages/react/src/use-copy-to-clipboard.ts` | exact |
| `packages/vue/src/use-copy-rich-content.ts` | composable | request-response | `packages/vue/src/use-copy-to-clipboard.ts` | exact |
| `packages/svelte/src/action/copy-rich-action.ts` | action | event-driven | `packages/svelte/src/action/copy-action.ts` | exact |
| `packages/svelte/src/runes/use-copy-rich-content.svelte.ts` | hook | request-response | `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts` | exact |
| `packages/svelte/src/stores/use-copy-rich-content.ts` | hook | request-response | `packages/svelte/src/stores/use-copy-to-clipboard.ts` | exact |
| `packages/react/src/index.ts` | barrel | re-export | `packages/react/src/index.ts` (self) | exact |
| `packages/vue/src/index.ts` | barrel | re-export | `packages/vue/src/index.ts` (self) | exact |
| `packages/svelte/src/index.ts` | barrel | re-export | `packages/svelte/src/index.ts` (self) | exact |
| `packages/svelte/src/runes/index.ts` | barrel | re-export | `packages/react/src/index.ts` | role-match |
| `packages/svelte/src/stores/index.ts` | barrel | re-export | `packages/react/src/index.ts` | role-match |
| `packages/react/tests/use-copy-rich-content.test.ts` | test | request-response | `packages/react/tests/use-copy-to-clipboard.test.ts` | exact |
| `packages/vue/tests/use-copy-rich-content.test.ts` | test | request-response | `packages/vue/tests/use-copy-to-clipboard.test.ts` | exact |
| `packages/svelte/tests/copy-rich-action.test.ts` | test | event-driven | `packages/svelte/tests/copy-action.test.ts` | exact |
| `packages/svelte/tests/use-copy-rich-content.test.ts` | test | request-response | `packages/svelte/tests/use-copy-to-clipboard.test.ts` | exact |

## Pattern Assignments

### `packages/react/src/use-copy-rich-content.ts` (hook, request-response)

**Analog:** `packages/react/src/use-copy-to-clipboard.ts`

**Imports pattern** (lines 1-3):
```typescript
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import { useCallback, useEffect, useRef, useState } from 'react'
```
Change to: import `RichContent` type and `copyRichContent` function instead of `copyToClipboard`.

**Interface pattern** (lines 9-40):
```typescript
export interface UseCopyToClipboardOptions extends ClipboardOptions {
	timeout?: number | undefined
}

export interface UseCopyToClipboardResult {
	copy: (text?: string) => Promise<boolean>
	copied: boolean
	error: BrowserUtilsError | null
	reset: () => void
}
```
Rename to `UseCopyRichContentOptions` / `UseCopyRichContentResult`. Change `copy: (text?: string)` to `copyRich: (content?: RichContent)`.

**Function signature pattern** (lines 57-60):
```typescript
export function useCopyToClipboard(
	initText?: string,
	options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
```
Change to `useCopyRichContent(initContent?: RichContent, options?: UseCopyRichContentOptions)`.

**State management pattern** (lines 61-76):
```typescript
const [copied, setCopied] = useState(false)
const [error, setError] = useState<BrowserUtilsError | null>(null)
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const timeout = options?.timeout ?? 2000

useEffect(() => {
	return () => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current)
		}
	}
}, [])
```
Copy unchanged.

**Copy function pattern** (lines 78-123):
```typescript
const copy = useCallback(
	async (callText?: string): Promise<boolean> => {
		const text = callText ?? initText

		if (text === undefined) {
			throw new TypeError(
				'[ctc] useCopyToClipboard: no text provided. Pass text at init or call-site.',
			)
		}

		setError(null)

		if (timerRef.current !== null) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}

		const success = await copyToClipboard(text, {
			onError: (err) => {
				setError(err)
				options?.onError?.(err)
			},
		})

		if (success) {
			setCopied(true)
			if (timeout > 0) {
				timerRef.current = setTimeout(() => {
					setCopied(false)
					timerRef.current = null
				}, timeout)
			}
		} else {
			setCopied(false)
		}

		return success
	},
	[initText, timeout, options?.onError],
)
```
Rename to `copyRich`. Change `callText?: string` to `callContent?: RichContent`. Change `callText ?? initText` to `callContent ?? initContent`. Change TypeError message. Change `copyToClipboard(text, ...)` to `copyRichContent(content, ...)`. Update `useCallback` deps from `[initText, ...]` to `[initContent, ...]`.

**Reset and return pattern** (lines 125-135):
```typescript
const reset = useCallback((): void => {
	if (timerRef.current !== null) {
		clearTimeout(timerRef.current)
		timerRef.current = null
	}
	setCopied(false)
	setError(null)
}, [])

return { copy, copied, error, reset }
```
Copy unchanged except return `{ copyRich, copied, error, reset }`.

---

### `packages/vue/src/use-copy-rich-content.ts` (composable, request-response)

**Analog:** `packages/vue/src/use-copy-to-clipboard.ts`

**Imports pattern** (lines 1-3):
```typescript
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import { onUnmounted, shallowRef } from 'vue'
```
Add `RichContent` to type imports. Change `copyToClipboard` to `copyRichContent`.

**State management pattern** (lines 69-71):
```typescript
const copied = shallowRef(false)
const error = shallowRef<BrowserUtilsError | null>(null)
const timeout = options?.timeout ?? 2000
```
Copy unchanged.

**Vue-specific error handling for missing content** (lines 77-89) -- D-02 divergence:
```typescript
async function copy(callText?: string): Promise<boolean> {
	const text = callText ?? initText

	if (text === undefined) {
		const err: BrowserUtilsError = {
			code: 'CLIPBOARD_NOT_SUPPORTED',
			message: 'No text provided to copy. Pass text at init or call-site.',
		}
		error.value = err
		options?.onError?.(err)
		return false
	}
```
Vue does NOT throw TypeError. It sets error state and returns false. Change param to `callContent?: RichContent`, resolution to `callContent ?? initContent`, and update message text.

**Core call pattern** (lines 100-102):
```typescript
const success = await copyToClipboard(text, {
	onError: options?.onError,
})
```
Note: Vue passes `options?.onError` directly (unlike React which wraps it to also call `setError`). Change to `copyRichContent(content, { onError: options?.onError })`.

**Lifecycle cleanup pattern** (lines 133-137):
```typescript
onUnmounted(() => {
	if (timer !== null) {
		clearTimeout(timer)
	}
})
```
Copy unchanged.

---

### `packages/svelte/src/action/copy-rich-action.ts` (action, event-driven)

**Analog:** `packages/svelte/src/action/copy-action.ts`

**Full file pattern** (lines 1-97):
```typescript
import type { BrowserUtilsError, OnErrorCallback } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import type { Action, ActionReturn } from 'svelte/action'

export interface CopyActionParams {
	text: string
	onError?: OnErrorCallback
}

interface CopyActionAttributes {
	'on:ctc:copy'?: (e: CustomEvent<{ text: string }>) => void
	'on:ctc:error'?: (e: CustomEvent<{ error: BrowserUtilsError }>) => void
}

export const copyAction: Action<
	HTMLElement,
	CopyActionParams,
	CopyActionAttributes
> = (node, params): ActionReturn<CopyActionParams, CopyActionAttributes> => {
	let current: CopyActionParams = params

	async function handleClick(): Promise<void> {
		const success = await copyToClipboard(current.text, {
			onError: (err) => {
				node.dispatchEvent(
					new CustomEvent('ctc:error', {
						detail: { error: err },
						bubbles: true,
					}),
				)
				current.onError?.(err)
			},
		})

		if (success) {
			node.dispatchEvent(
				new CustomEvent('ctc:copy', {
					detail: { text: current.text },
					bubbles: true,
				}),
			)
		}
	}

	node.addEventListener('click', handleClick)

	return {
		update(newParams) {
			current = newParams
		},
		destroy() {
			node.removeEventListener('click', handleClick)
		},
	}
}
```
Substitutions:
- Import `copyRichContent` and `RichContent` instead of `copyToClipboard`
- `CopyActionParams` becomes `CopyRichActionParams` with `{ html: string, text: string, onError? }`
- `CopyActionAttributes` becomes `CopyRichActionAttributes` with events `'on:ctc:rich-copy'` and `'on:ctc:rich-error'`
- Event names: `ctc:copy` -> `ctc:rich-copy`, `ctc:error` -> `ctc:rich-error`
- Success detail: `{ text: current.text }` -> `{ html: current.html, text: current.text }`
- Core call: `copyToClipboard(current.text, ...)` -> `copyRichContent({ html: current.html, text: current.text }, ...)`

---

### `packages/svelte/src/runes/use-copy-rich-content.svelte.ts` (hook, request-response)

**Analog:** `packages/svelte/src/runes/use-copy-to-clipboard.svelte.ts`

**Imports pattern** (lines 1-2):
```typescript
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
```
Add `RichContent` to type imports. Change `copyToClipboard` to `copyRichContent`.

**$state + $effect pattern** (lines 64-79):
```typescript
const state = $state<{ copied: boolean; error: BrowserUtilsError | null }>({
	copied: false,
	error: null,
})
const timeout = options?.timeout ?? 2000
let timer: ReturnType<typeof setTimeout> | null = null

$effect(() => {
	return () => {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
	}
})
```
Copy unchanged.

**TypeError throw pattern** (lines 85-89) -- same as React, throws TypeError:
```typescript
if (text === undefined) {
	throw new TypeError(
		'[ctc] useCopyToClipboard: no text provided. Pass text at init or call-site.',
	)
}
```
Rename message to reference `useCopyRichContent` and `content` instead of `text`.

**Reactive getter return pattern** (lines 132-142):
```typescript
return {
	copy,
	reset,
	get copied() {
		return state.copied
	},
	get error() {
		return state.error
	},
}
```
Change `copy` to `copyRich`.

---

### `packages/svelte/src/stores/use-copy-rich-content.ts` (hook, request-response)

**Analog:** `packages/svelte/src/stores/use-copy-to-clipboard.ts`

**Imports pattern** (lines 1-4):
```typescript
import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import type { Readable } from 'svelte/store'
import { readonly, writable } from 'svelte/store'
```
Add `RichContent`. Change `copyToClipboard` to `copyRichContent`.

**Writable stores pattern** (lines 68-71):
```typescript
const copiedW = writable(false)
const errorW = writable<BrowserUtilsError | null>(null)
const timeout = options?.timeout ?? 2000
let timer: ReturnType<typeof setTimeout> | null = null
```
Copy unchanged.

**TypeError throw pattern** (lines 76-80) -- same as runes, throws TypeError:
```typescript
if (text === undefined) {
	throw new TypeError(
		'[ctc] useCopyToClipboard: no text provided. Pass text at init or call-site.',
	)
}
```

**Readonly return pattern** (lines 123-129):
```typescript
return {
	copy,
	copied: readonly(copiedW),
	error: readonly(errorW),
	reset,
}
```
Change `copy` to `copyRich`.

---

### `packages/react/src/index.ts` (barrel, modify)

**Current content** (lines 1-11):
```typescript
export type {
	BrowserUtilsError,
	ClipboardOptions,
	ErrorCode,
	OnErrorCallback,
} from '@ngockhoi96/ctc'
export type {
	UseCopyToClipboardOptions,
	UseCopyToClipboardResult,
} from './use-copy-to-clipboard.ts'
export { useCopyToClipboard } from './use-copy-to-clipboard.ts'
```
Add: `RichContent` to core type re-exports. Add `UseCopyRichContentOptions`, `UseCopyRichContentResult` type exports and `useCopyRichContent` function export from `./use-copy-rich-content.ts`.

---

### `packages/vue/src/index.ts` (barrel, modify)

**Current content** (lines 1-11):
Same structure as React. Apply identical additions: `RichContent` type re-export from core, plus new composable type and function exports.

---

### `packages/svelte/src/index.ts` (barrel, modify)

**Current content** (lines 1-8):
```typescript
export type {
	BrowserUtilsError,
	ClipboardOptions,
	ErrorCode,
	OnErrorCallback,
} from '@ngockhoi96/ctc'
export type { CopyActionParams } from './action/copy-action.ts'
export { copyAction } from './action/copy-action.ts'
```
Add: `RichContent` to core type re-exports. Add `CopyRichActionParams` type export and `copyRichAction` function export from `./action/copy-rich-action.ts`.

---

### `packages/svelte/src/runes/index.ts` (barrel, NEW)

**No existing barrel file.** Create following the established barrel pattern from `packages/react/src/index.ts`.

```typescript
// Re-export text clipboard (currently the direct tsdown entry)
export type { UseCopyToClipboardOptions, UseCopyToClipboardResult } from './use-copy-to-clipboard.svelte.ts'
export { useCopyToClipboard } from './use-copy-to-clipboard.svelte.ts'
// Re-export rich clipboard
export type { UseCopyRichContentOptions, UseCopyRichContentResult } from './use-copy-rich-content.svelte.ts'
export { useCopyRichContent } from './use-copy-rich-content.svelte.ts'
```

**Critical:** Update `packages/svelte/tsdown.config.ts` entry from `'src/runes/use-copy-to-clipboard.svelte.ts'` to `'src/runes/index.ts'`. Update `packages/svelte/package.json` `"./runes"` `"svelte"` condition from `"./src/runes/use-copy-to-clipboard.svelte.ts"` to `"./src/runes/index.ts"`.

---

### `packages/svelte/src/stores/index.ts` (barrel, NEW)

Same pattern as runes barrel but with `.ts` extensions (not `.svelte.ts`).

```typescript
export type { UseCopyToClipboardOptions, UseCopyToClipboardResult } from './use-copy-to-clipboard.ts'
export { useCopyToClipboard } from './use-copy-to-clipboard.ts'
export type { UseCopyRichContentOptions, UseCopyRichContentResult } from './use-copy-rich-content.ts'
export { useCopyRichContent } from './use-copy-rich-content.ts'
```

**Update:** `packages/svelte/tsdown.config.ts` entry from `'src/stores/use-copy-to-clipboard.ts'` to `'src/stores/index.ts'`.

---

### `packages/react/tests/use-copy-rich-content.test.ts` (test)

**Analog:** `packages/react/tests/use-copy-to-clipboard.test.ts`

**Test setup pattern** (lines 1-17):
```typescript
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyToClipboard } from '../src/use-copy-to-clipboard.ts'
import { createClipboardMock } from './helpers/create-clipboard-mock.ts'

const mock = createClipboardMock()

beforeEach(() => {
	mock.install()
	vi.useFakeTimers()
})

afterEach(() => {
	mock.uninstall()
	vi.useRealTimers()
	vi.clearAllMocks()
})
```
Change import to `useCopyRichContent`. Need a `createRichClipboardMock` helper (new file or extend existing). Use `mock.write` instead of `mock.writeText`.

**Happy path test pattern** (lines 29-41):
```typescript
it('returns true and sets copied=true when clipboard write succeeds', async () => {
	mock.writeText.mockResolvedValue(undefined)
	const { result } = renderHook(() => useCopyToClipboard('hello'))

	let returnValue: boolean | undefined
	await act(async () => {
		returnValue = await result.current.copy()
	})

	expect(returnValue).toBe(true)
	expect(result.current.copied).toBe(true)
	expect(result.current.error).toBeNull()
})
```
Change: `useCopyToClipboard('hello')` to `useCopyRichContent({ html: '<b>Hello</b>', text: 'Hello' })`. Change `result.current.copy()` to `result.current.copyRich()`. Change `mock.writeText` to `mock.write`.

**TypeError test pattern** (lines 211-219):
```typescript
it('throws TypeError when text is undefined at both init and call-site (D-02)', async () => {
	const { result } = renderHook(() => useCopyToClipboard())

	await expect(
		act(async () => {
			await result.current.copy()
		}),
	).rejects.toThrow(TypeError)
})
```
Change to `useCopyRichContent()` and `result.current.copyRich()`.

---

### `packages/vue/tests/use-copy-rich-content.test.ts` (test)

**Analog:** `packages/vue/tests/use-copy-to-clipboard.test.ts`

**Test setup pattern** (lines 1-4):
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyToClipboard } from '../src/use-copy-to-clipboard.ts'
import { createClipboardMock } from './helpers/create-clipboard-mock.ts'
import { withSetup } from './helpers/with-setup.ts'
```
Change import to `useCopyRichContent`. Use rich clipboard mock.

**Vue graceful error test pattern** (lines 182-191) -- Vue does NOT throw:
```typescript
it('returns false and sets error.value when text is undefined at both sites (D-02)', async () => {
	const [{ copy, copied, error }] = withSetup(() => useCopyToClipboard())

	const result = await copy()

	expect(result).toBe(false)
	expect(copied.value).toBe(false)
	expect(error.value).not.toBeNull()
	expect(error.value?.code).toBe('CLIPBOARD_NOT_SUPPORTED')
})
```
Change to `useCopyRichContent()` and `copyRich()`.

---

### `packages/svelte/tests/copy-rich-action.test.ts` (test)

**Analog:** `packages/svelte/tests/copy-action.test.ts`

**Fixture-based test pattern** (lines 1-7):
```typescript
import type { BrowserUtilsError } from '@ngockhoi96/ctc'
import { fireEvent, render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyAction } from '../src/action/copy-action.ts'
import CopyButton from './fixtures/CopyButton.svelte'
import { createClipboardMock } from './helpers/create-clipboard-mock.ts'
```
Change to `copyRichAction`, new `CopyRichButton.svelte` fixture, rich clipboard mock.

**Event assertion pattern** (lines 38-50):
```typescript
it('dispatches a bubbling ctc:copy CustomEvent with detail.text on success (D-08)', async () => {
	mock.writeText.mockResolvedValue(undefined)
	const handleCopy = vi.fn()
	const { getByRole, container } = render(CopyButton, {
		props: { text: 'hello' },
	})
	container.addEventListener('ctc:copy', handleCopy as EventListener)
	await fireEvent.click(getByRole('button'))
	await vi.waitFor(() => expect(handleCopy).toHaveBeenCalledOnce())
	const evt = handleCopy.mock.calls[0][0] as CustomEvent<{ text: string }>
	expect(evt.detail.text).toBe('hello')
	expect(evt.bubbles).toBe(true)
})
```
Change event name to `ctc:rich-copy`. Change props to `{ html: '<b>hello</b>', text: 'hello' }`. Assert `evt.detail.html` and `evt.detail.text`.

---

### `packages/svelte/tests/use-copy-rich-content.test.ts` (test)

**Analog:** `packages/svelte/tests/use-copy-to-clipboard.test.ts`

**Runes test helper pattern** (lines 27-45):
```typescript
function renderRunes(
	initText?: string,
	options?: UseCopyToClipboardOptions,
): { api: RunesResult; unmount: () => void } {
	let api: RunesResult | undefined
	const utils = render(RunesHost, {
		props: {
			initText,
			options,
			onReady: (a: RunesResult) => {
				api = a
			},
		},
	})
	if (!api) {
		throw new Error('RunesHost did not invoke onReady synchronously')
	}
	return { api, unmount: utils.unmount }
}
```
Change to `initContent?: RichContent`, `RichRunesHost.svelte` fixture, `UseCopyRichContentResult`.

**Stores test pattern** (lines 47-60):
```typescript
describe('useCopyToClipboard — /stores', () => {
	describe('initial state', () => {
		it('copied=false and error=null on init', () => {
			const { copied, error } = useStores()
			expect(get(copied)).toBe(false)
			expect(get(error)).toBeNull()
		})
	})
```
Import `useCopyRichContent` as `useRichStores` from stores path. Change `copy()` to `copyRich()`.

---

## Shared Patterns

### Rich Clipboard Mock (NEW -- needed by all adapter tests)

**Source:** Derived from `packages/core/tests/unit/clipboard/rich-copy.test.ts` (lines 5-19) + existing `packages/react/tests/helpers/create-clipboard-mock.ts` pattern.

**Apply to:** All rich content adapter test files. Create as `tests/helpers/create-rich-clipboard-mock.ts` in each adapter package (or extend existing `create-clipboard-mock.ts`).

```typescript
// Derived from core test pattern + adapter mock pattern
import { vi } from 'vitest'

export function createRichClipboardMock() {
	const write = vi.fn()

	function install(): void {
		vi.stubGlobal('ClipboardItem', class MockClipboardItem {
			constructor(public data: Record<string, Blob>) {}
		})
		vi.stubGlobal('navigator', {
			clipboard: { write },
		})
		Object.defineProperty(window, 'isSecureContext', {
			value: true,
			writable: true,
			configurable: true,
		})
	}

	function uninstall(): void {
		vi.unstubAllGlobals()
	}

	return { write, install, uninstall }
}
```

### Error Handling Convention (per-framework)

**Source:** React/Svelte from `packages/react/src/use-copy-to-clipboard.ts` lines 83-87; Vue from `packages/vue/src/use-copy-to-clipboard.ts` lines 81-89.

**Apply to:** All `useCopyRichContent` implementations.

| Framework | Missing content behavior |
|-----------|-------------------------|
| React | `throw new TypeError('[ctc] useCopyRichContent: no content provided...')` |
| Vue | Set `error.value = { code: 'CLIPBOARD_NOT_SUPPORTED', message: '...' }`, call `options?.onError?.(err)`, return `false` |
| Svelte runes | `throw new TypeError('[ctc] useCopyRichContent: no content provided...')` |
| Svelte stores | `throw new TypeError('[ctc] useCopyRichContent: no content provided...')` |

### TSDoc Comment Style

**Source:** All existing hooks follow this TSDoc structure.

**Apply to:** All new exports.

Each exported function/interface gets:
- One-line summary
- `@param` for each parameter
- `@returns` description
- `@example` with framework-specific code block (tsx for React, vue for Vue, svelte for Svelte)

### Svelte Test Fixtures (NEW)

**Source:** `packages/svelte/tests/fixtures/CopyButton.svelte` and `packages/svelte/tests/fixtures/RunesHost.svelte`

**Apply to:** New Svelte test fixtures.

**CopyRichButton.svelte** (analog: CopyButton.svelte lines 1-11):
```svelte
<script lang="ts">
import type { OnErrorCallback } from '@ngockhoi96/ctc'
// biome-ignore lint/correctness/noUnusedImports: used as Svelte action directive (use:copyRichAction)
import { copyRichAction } from '../../src/action/copy-rich-action.ts'

export let html: string
export let text: string
export let onError: OnErrorCallback | undefined = undefined
</script>

<button use:copyRichAction={{ html, text, onError }}>Copy Rich</button>
```

**RichRunesHost.svelte** (analog: RunesHost.svelte lines 1-14):
```svelte
<script lang="ts">
import {
	type UseCopyRichContentOptions,
	type UseCopyRichContentResult,
	useCopyRichContent,
} from '../../src/runes/use-copy-rich-content.svelte.ts'

export let initContent: import('@ngockhoi96/ctc').RichContent | undefined = undefined
export let options: UseCopyRichContentOptions | undefined = undefined
export let onReady: (api: UseCopyRichContentResult) => void

const api = useCopyRichContent(initContent, options)
onReady(api)
</script>
```

### Build Configuration Updates

**Svelte tsdown.config.ts** (analog: current file at `packages/svelte/tsdown.config.ts`):

Update entry points from direct files to barrel files:
```typescript
entry: {
	index: 'src/index.ts',
	stores: 'src/stores/index.ts',        // was: 'src/stores/use-copy-to-clipboard.ts'
	runes: 'src/runes/index.ts',           // was: 'src/runes/use-copy-to-clipboard.svelte.ts'
},
```

**Svelte package.json exports** -- update `"./runes"` `"svelte"` condition:
```jsonc
"svelte": "./src/runes/index.ts"  // was: "./src/runes/use-copy-to-clipboard.svelte.ts"
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | -- | -- | All files have exact analogs in the existing codebase |

## Metadata

**Analog search scope:** `packages/react/`, `packages/vue/`, `packages/svelte/`, `packages/core/`
**Files scanned:** 30+
**Pattern extraction date:** 2026-04-16
