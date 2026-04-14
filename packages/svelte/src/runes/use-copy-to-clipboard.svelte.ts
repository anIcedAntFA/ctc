import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'

/**
 * Options for {@link useCopyToClipboard} (runes variant).
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
 * Return value of {@link useCopyToClipboard} (runes variant).
 *
 * `copied` and `error` are reactive getters backed by `$state` — read directly
 * (e.g. `result.copied`) inside a Svelte 5 component or `$effect`. Do NOT
 * destructure into local variables outside a reactive scope; the getters
 * preserve reactivity (Pitfall 2).
 */
export interface UseCopyToClipboardResult {
	/**
	 * Trigger a clipboard copy. Accepts optional text that overrides the init-time
	 * text. Returns `true` on success, `false` on failure.
	 */
	copy: (text?: string) => Promise<boolean>
	/** Reactive: `true` immediately after a successful copy; resets after `timeout` ms. */
	readonly copied: boolean
	/** Reactive: structured error from the most recent failed copy attempt, or `null`. */
	readonly error: BrowserUtilsError | null
	/**
	 * Immediately resets `copied` to `false` and `error` to `null`.
	 * Also cancels any pending auto-reset timer.
	 */
	reset: () => void
}

/**
 * Svelte 5 runes-based clipboard copy helper. Must be called inside a Svelte 5
 * component `<script>` block (or another `$effect.root` context) — it relies on
 * `$effect` for timer cleanup on host unmount.
 *
 * @param initText - Text to copy. Can be overridden per `copy()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns Reactive object with `{ copy, copied, error, reset }`.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/runes'
 *   const ctc = useCopyToClipboard('Hello')
 * </script>
 * <button onclick={() => ctc.copy()}>{ctc.copied ? 'Copied!' : 'Copy'}</button>
 * ```
 */
export function useCopyToClipboard(
	initText?: string,
	options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
	const state = $state<{ copied: boolean; error: BrowserUtilsError | null }>({
		copied: false,
		error: null,
	})
	const timeout = options?.timeout ?? 2000
	let timer: ReturnType<typeof setTimeout> | null = null

	// $effect cleanup runs on host component unmount (D-16).
	$effect(() => {
		return () => {
			if (timer !== null) {
				clearTimeout(timer)
				timer = null
			}
		}
	})

	async function copy(callText?: string): Promise<boolean> {
		const text = callText ?? initText

		// D-19: no text at either init or call-site — programmer error.
		if (text === undefined) {
			const err: BrowserUtilsError = {
				code: 'CLIPBOARD_NOT_SUPPORTED',
				message: 'No text provided to copy. Pass text at init or call-site.',
			}
			state.error = err
			options?.onError?.(err)
			return false
		}

		// Clear error before each attempt.
		state.error = null

		// Clear any in-flight auto-reset timer from a prior copy.
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}

		const success = await copyToClipboard(text, {
			onError: (err) => {
				state.error = err
				options?.onError?.(err)
			},
		})

		if (success) {
			state.copied = true
			// D-18: timeout === 0 means never auto-reset.
			if (timeout > 0) {
				timer = setTimeout(() => {
					state.copied = false
					timer = null
				}, timeout)
			}
		} else {
			state.copied = false
		}
		return success
	}

	function reset(): void {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
		state.copied = false
		state.error = null
	}

	// Pitfall 2: getters preserve reactivity — `{ copied: state.copied }` would snapshot.
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
}
