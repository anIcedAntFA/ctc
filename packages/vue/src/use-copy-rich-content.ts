import type {
	BrowserUtilsError,
	ClipboardOptions,
	RichContent,
} from '@ngockhoi96/ctc'
import { copyRichContent } from '@ngockhoi96/ctc'
import { onUnmounted, shallowRef } from 'vue'

/**
 * Options for useCopyRichContent.
 * Extends ClipboardOptions (which provides the onError callback).
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
 * Return value of useCopyRichContent.
 * `copied` and `error` are Vue shallow refs — access values via `.value`.
 */
export interface UseCopyRichContentResult {
	/**
	 * Trigger a rich clipboard copy. Accepts optional content that overrides the
	 * init-time content. Returns `true` on success, `false` on failure.
	 */
	copyRich: (content?: RichContent) => Promise<boolean>
	/** Ref: `true` immediately after a successful copy; resets after `timeout` ms. */
	copied: ReturnType<typeof shallowRef<boolean>>
	/**
	 * Ref: Structured error from the most recent failed copy attempt.
	 * `null` when no error. Cleared to `null` at the start of each `copyRich()` call.
	 */
	error: ReturnType<typeof shallowRef<BrowserUtilsError | null>>
	/**
	 * Immediately resets `copied.value` to `false` and `error.value` to `null`.
	 * Also cancels any pending auto-reset timer.
	 */
	reset: () => void
}

/**
 * Vue 3 composable for rich clipboard copy (HTML + plain text) with managed
 * `copied` and `error` state.
 *
 * `copied` and `error` are shallow refs — read via `.value` in templates and
 * composable callers.
 *
 * @param initContent - Rich content to copy. Can be overridden per `copyRich()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns `{ copyRich, copied, error, reset }`
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCopyRichContent } from '@ngockhoi96/ctc-vue'
 * const { copyRich, copied, error } = useCopyRichContent({
 *   html: '<b>Hello</b>, world!',
 *   text: 'Hello, world!',
 * })
 * </script>
 * <template>
 *   <button @click="copyRich()">{{ copied ? 'Copied!' : 'Copy' }}</button>
 *   <span v-if="error">Error: {{ error.code }}</span>
 * </template>
 * ```
 */
export function useCopyRichContent(
	initContent?: RichContent,
	options?: UseCopyRichContentOptions,
): UseCopyRichContentResult {
	const copied = shallowRef(false)
	const error = shallowRef<BrowserUtilsError | null>(null)
	const timeout = options?.timeout ?? 2000

	// Plain variable — not a ref. Timer handle is implementation detail,
	// not reactive state. Avoids unnecessary reactivity overhead.
	let timer: ReturnType<typeof setTimeout> | null = null

	async function copyRich(callContent?: RichContent): Promise<boolean> {
		const content = callContent ?? initContent

		// D-02: no content at either init or call-site — programmer error.
		// Throws TypeError to match React and Svelte adapter contract.
		if (content === undefined) {
			throw new TypeError(
				'[ctc] useCopyRichContent: no content provided. Pass content at init or call-site.',
			)
		}

		// D-07: clear error before each attempt.
		error.value = null

		// Clear any in-flight auto-reset timer from a prior copy.
		if (timer !== null) {
			clearTimeout(timer)
			timer = null
		}

		const success = await copyRichContent(content, {
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
			timer = null
		}
	})

	return { copyRich, copied, error, reset }
}
