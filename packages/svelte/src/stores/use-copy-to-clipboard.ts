import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import type { Readable } from 'svelte/store'
import { readonly, writable } from 'svelte/store'

/**
 * Options for {@link useCopyToClipboard}. Extends ClipboardOptions (onError).
 */
export interface UseCopyToClipboardOptions extends ClipboardOptions {
	/**
	 * Milliseconds before `copied` auto-resets to `false` after a successful copy.
	 * Set to `0` to disable auto-reset — `copied` stays `true` until the next
	 * `copy()` call or an explicit `reset()` call.
	 * @default 2000
	 */
	timeout?: number | undefined
}

/**
 * Return value of {@link useCopyToClipboard} (stores variant).
 *
 * `copied` and `error` are svelte/store readables — subscribe in a component
 * with `$copied` / `$error`, or read synchronously via `get(copied)`.
 */
export interface UseCopyToClipboardResult {
	/**
	 * Trigger a clipboard copy. Accepts optional text that overrides the init-time
	 * text. Returns `true` on success, `false` on failure.
	 */
	copy: (text?: string) => Promise<boolean>
	/** Readable: `true` immediately after a successful copy; resets after `timeout` ms. */
	copied: Readable<boolean>
	/**
	 * Readable: structured error from the most recent failed copy attempt.
	 * `null` when no error. Cleared to `null` at the start of each `copy()` call.
	 */
	error: Readable<BrowserUtilsError | null>
	/**
	 * Immediately resets `copied` to `false` and `error` to `null`.
	 * Also cancels any pending auto-reset timer.
	 */
	reset: () => void
}

/**
 * Svelte stores-based clipboard copy helper. Compatible with Svelte 4 and 5.
 *
 * No automatic unmount cleanup — caller drives `reset()` from `onDestroy`
 * if a pending timer needs to be cancelled (D-14).
 *
 * @param initText - Text to copy. Can be overridden per `copy()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns `{ copy, copied, error, reset }`
 *
 * @example
 * ```svelte
 * <script>
 *   import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/stores'
 *   const { copy, copied, error } = useCopyToClipboard('Hello')
 * </script>
 * <button on:click={() => copy()}>{$copied ? 'Copied!' : 'Copy'}</button>
 * ```
 */
export function useCopyToClipboard(
	initText?: string,
	options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
	const copiedW = writable(false)
	const errorW = writable<BrowserUtilsError | null>(null)
	const timeout = options?.timeout ?? 2000
	let timer: ReturnType<typeof setTimeout> | null = null

	async function copy(callText?: string): Promise<boolean> {
		const text = callText ?? initText

		// D-19: no text at either init or call-site — programmer error.
		if (text === undefined) {
			throw new TypeError(
				'[ctc] useCopyToClipboard: no text provided. Pass text at init or call-site.',
			)
		}

		// Clear error before each attempt.
		errorW.set(null)

		// Clear any in-flight auto-reset timer from a prior copy.
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}

		const success = await copyToClipboard(text, {
			onError: (err) => {
				errorW.set(err)
				options?.onError?.(err)
			},
		})

		if (success) {
			copiedW.set(true)
			// D-18: timeout === 0 means never auto-reset.
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
		copy,
		copied: readonly(copiedW),
		error: readonly(errorW),
		reset,
	}
}
