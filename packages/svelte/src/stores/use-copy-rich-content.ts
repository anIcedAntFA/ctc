import type {
	BrowserUtilsError,
	ClipboardOptions,
	RichContent,
} from '@ngockhoi96/ctc'
import { copyRichContent } from '@ngockhoi96/ctc'
import type { Readable } from 'svelte/store'
import { readonly, writable } from 'svelte/store'

/**
 * Options for {@link useCopyRichContent}. Extends ClipboardOptions (onError).
 */
export interface UseCopyRichContentOptions extends ClipboardOptions {
	/**
	 * Milliseconds before `copied` auto-resets to `false` after a successful copy.
	 * Set to `0` to disable auto-reset — `copied` stays `true` until the next
	 * `copyRich()` call or an explicit `reset()` call.
	 * @default 2000
	 */
	timeout?: number | undefined
}

/**
 * Return value of {@link useCopyRichContent} (stores variant).
 *
 * `copied` and `error` are svelte/store readables — subscribe in a component
 * with `$copied` / `$error`, or read synchronously via `get(copied)`.
 */
export interface UseCopyRichContentResult {
	/**
	 * Trigger a rich clipboard copy. Accepts optional content that overrides
	 * the init-time content. Returns `true` on success, `false` on failure.
	 */
	copyRich: (content?: RichContent) => Promise<boolean>
	/** Readable: `true` immediately after a successful copy; resets after `timeout` ms. */
	copied: Readable<boolean>
	/**
	 * Readable: structured error from the most recent failed copy attempt.
	 * `null` when no error. Cleared to `null` at the start of each `copyRich()` call.
	 */
	error: Readable<BrowserUtilsError | null>
	/**
	 * Immediately resets `copied` to `false` and `error` to `null`.
	 * Also cancels any pending auto-reset timer.
	 */
	reset: () => void
}

/**
 * Svelte stores-based rich clipboard copy helper. Compatible with Svelte 4 and 5.
 *
 * No automatic unmount cleanup — caller drives `reset()` from `onDestroy`
 * if a pending timer needs to be cancelled.
 *
 * @param initContent - Rich content to copy. Can be overridden per `copyRich()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns `{ copyRich, copied, error, reset }`
 *
 * @example
 * ```svelte
 * <script>
 *   import { useCopyRichContent } from '@ngockhoi96/ctc-svelte/stores'
 *   const { copyRich, copied, error } = useCopyRichContent({ html: '<b>Hello</b>', text: 'Hello' })
 * </script>
 * <button on:click={() => copyRich()}>{$copied ? 'Copied!' : 'Copy'}</button>
 * ```
 */
export function useCopyRichContent(
	initContent?: RichContent,
	options?: UseCopyRichContentOptions,
): UseCopyRichContentResult {
	const copiedW = writable(false)
	const errorW = writable<BrowserUtilsError | null>(null)
	const timeout = options?.timeout ?? 2000
	let timer: ReturnType<typeof setTimeout> | null = null

	async function copyRich(callContent?: RichContent): Promise<boolean> {
		const content = callContent ?? initContent

		// D-02: no content at either init or call-site — programmer error.
		if (content === undefined) {
			throw new TypeError(
				'[ctc] useCopyRichContent: no content provided. Pass content at init or call-site.',
			)
		}

		// Clear error before each attempt.
		errorW.set(null)

		// Clear any in-flight auto-reset timer from a prior copy.
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}

		const success = await copyRichContent(content, {
			onError: (err) => {
				errorW.set(err)
				options?.onError?.(err)
			},
		})

		if (success) {
			copiedW.set(true)
			// timeout === 0 means never auto-reset.
			if (timeout > 0) {
				timer = setTimeout(() => {
					copiedW.set(false)
					timer = null
				}, timeout)
			}
		} else {
			copiedW.set(false)
		}
		return success
	}

	function reset(): void {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
		copiedW.set(false)
		errorW.set(null)
	}

	return {
		copyRich,
		copied: readonly(copiedW),
		error: readonly(errorW),
		reset,
	}
}
