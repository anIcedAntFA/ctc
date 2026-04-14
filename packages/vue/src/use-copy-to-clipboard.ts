import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import { onUnmounted, shallowRef } from 'vue'

/**
 * Options for useCopyToClipboard.
 * Extends ClipboardOptions (which provides the onError callback).
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
 * Return value of useCopyToClipboard.
 * `copied` and `error` are Vue shallow refs — access values via `.value`.
 */
export interface UseCopyToClipboardResult {
	/**
	 * Trigger a clipboard copy. Accepts optional text that overrides the init-time
	 * text. Returns `true` on success, `false` on failure.
	 */
	copy: (text?: string) => Promise<boolean>
	/** Ref: `true` immediately after a successful copy; resets after `timeout` ms. */
	copied: ReturnType<typeof shallowRef<boolean>>
	/**
	 * Ref: Structured error from the most recent failed copy attempt.
	 * `null` when no error. Cleared to `null` at the start of each `copy()` call.
	 */
	error: ReturnType<typeof shallowRef<BrowserUtilsError | null>>
	/**
	 * Immediately resets `copied.value` to `false` and `error.value` to `null`.
	 * Also cancels any pending auto-reset timer.
	 */
	reset: () => void
}

/**
 * Vue 3 composable for clipboard copy with managed `copied` and `error` state.
 *
 * `copied` and `error` are shallow refs — read via `.value` in templates and
 * composable callers.
 *
 * @param initText - Text to copy. Can be overridden per `copy()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns `{ copy, copied, error, reset }`
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCopyToClipboard } from '@ngockhoi96/ctc-vue'
 * const { copy, copied, error } = useCopyToClipboard('Hello world')
 * </script>
 * <template>
 *   <button @click="copy()">{{ copied ? 'Copied!' : 'Copy' }}</button>
 *   <span v-if="error">Error: {{ error.code }}</span>
 * </template>
 * ```
 */
export function useCopyToClipboard(
	initText?: string,
	options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
	const copied = shallowRef(false)
	const error = shallowRef<BrowserUtilsError | null>(null)
	const timeout = options?.timeout ?? 2000

	// Plain variable — not a ref. Timer handle is implementation detail,
	// not reactive state. Avoids unnecessary reactivity overhead.
	let timer: ReturnType<typeof setTimeout> | null = null

	async function copy(callText?: string): Promise<boolean> {
		const text = callText ?? initText

		// D-02: no text at either init or call-site — programmer error.
		if (text === undefined) {
			const err: BrowserUtilsError = {
				code: 'CLIPBOARD_NOT_SUPPORTED',
				message: 'No text provided to copy. Pass text at init or call-site.',
			}
			error.value = err
			options?.onError?.(err)
			return false
		}

		// D-07: clear error before each attempt.
		error.value = null

		// Clear any in-flight auto-reset timer from a prior copy.
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}

		const success = await copyToClipboard(text, {
			onError: options?.onError,
		})

		if (success) {
			copied.value = true
			// D-05: timeout === 0 means never auto-reset.
			if (timeout > 0) {
				timer = setTimeout(() => {
					copied.value = false
					timer = null
				}, timeout)
			}
		} else {
			copied.value = false
		}

		return success
	}

	function reset(): void {
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}
		copied.value = false
		error.value = null
	}

	// Lifecycle cleanup — fires when the component using this composable unmounts.
	// `onUnmounted` is scoped to the calling component's instance because composables
	// call lifecycle hooks during setup(). Safe in SSR — onUnmounted is a no-op
	// on the server (no mount/unmount cycle).
	onUnmounted(() => {
		if (timer !== null) {
			clearTimeout(timer)
		}
	})

	return { copy, copied, error, reset }
}
