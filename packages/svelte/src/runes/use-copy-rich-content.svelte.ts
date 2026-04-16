import type {
	BrowserUtilsError,
	ClipboardOptions,
	RichContent,
} from '@ngockhoi96/ctc'
import { copyRichContent } from '@ngockhoi96/ctc'

/**
 * Options for {@link useCopyRichContent} (runes variant).
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
 * Return value of {@link useCopyRichContent} (runes variant).
 *
 * `copied` and `error` are reactive getters backed by `$state` — read directly
 * (e.g. `result.copied`) inside a Svelte 5 component or `$effect`. Do NOT
 * destructure into local variables outside a reactive scope; the getters
 * preserve reactivity (Pitfall 2).
 */
export interface UseCopyRichContentResult {
	/**
	 * Trigger a rich clipboard copy. Accepts optional content that overrides
	 * the init-time content. Returns `true` on success, `false` on failure.
	 */
	copyRich: (content?: RichContent) => Promise<boolean>
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
 * Svelte 5 runes-based rich clipboard copy helper. Must be called inside a Svelte 5
 * component `<script>` block (or another `$effect.root` context) — it relies on
 * `$effect` for timer cleanup on host unmount.
 *
 * @param initContent - Rich content to copy. Can be overridden per `copyRich()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns Reactive object with `{ copyRich, copied, error, reset }`.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useCopyRichContent } from '@ngockhoi96/ctc-svelte/runes'
 *   const ctc = useCopyRichContent({ html: '<b>Hello</b>', text: 'Hello' })
 * </script>
 * <button onclick={() => ctc.copyRich()}>{ctc.copied ? 'Copied!' : 'Copy'}</button>
 * ```
 */
export function useCopyRichContent(
	initContent?: RichContent,
	options?: UseCopyRichContentOptions,
): UseCopyRichContentResult {
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

	async function copyRich(callContent?: RichContent): Promise<boolean> {
		const content = callContent ?? initContent

		// D-02: no content at either init or call-site — programmer error.
		if (content === undefined) {
			throw new TypeError(
				'[ctc] useCopyRichContent: no content provided. Pass content at init or call-site.',
			)
		}

		// Clear error before each attempt.
		state.error = null

		// Clear any in-flight auto-reset timer from a prior copy.
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}

		const success = await copyRichContent(content, {
			onError: (err) => {
				state.error = err
				options?.onError?.(err)
			},
		})

		if (success) {
			state.copied = true
			// timeout === 0 means never auto-reset.
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
		copyRich,
		reset,
		get copied() {
			return state.copied
		},
		get error() {
			return state.error
		},
	}
}
