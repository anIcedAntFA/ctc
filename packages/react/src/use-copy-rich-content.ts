import type {
	BrowserUtilsError,
	ClipboardOptions,
	RichContent,
} from '@ngockhoi96/ctc'
import { copyRichContent } from '@ngockhoi96/ctc'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Options for useCopyRichContent.
 * Extends ClipboardOptions (which provides onError callback).
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
 */
export interface UseCopyRichContentResult {
	/**
	 * Trigger a rich clipboard copy. Accepts optional content that overrides the
	 * init-time content. Returns `true` on success, `false` on failure.
	 */
	copyRich: (content?: RichContent) => Promise<boolean>
	/** `true` immediately after a successful copy; resets after `timeout` ms. */
	copied: boolean
	/**
	 * Structured error from the most recent failed copy attempt.
	 * `null` when no error. Cleared to `null` at the start of each `copyRich()` call.
	 */
	error: BrowserUtilsError | null
	/**
	 * Immediately resets `copied` to `false` and `error` to `null`.
	 * Also cancels any pending auto-reset timer.
	 */
	reset: () => void
}

/**
 * React hook for rich clipboard copy (HTML + plain text) with managed `copied` and `error` state.
 *
 * Wraps `copyRichContent` from `@ngockhoi96/ctc` with React state management.
 * Requires a secure context (HTTPS or localhost) and must be called within a user gesture handler.
 *
 * @param initContent - Rich content (`{ html, text }`) to copy. Can be overridden per `copyRich()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns `{ copyRich, copied, error, reset }`
 *
 * @example
 * ```tsx
 * const { copyRich, copied } = useCopyRichContent({ html: '<b>Hello</b>', text: 'Hello' })
 * <button onClick={() => copyRich()}>
 *   {copied ? 'Copied!' : 'Copy Rich'}
 * </button>
 * ```
 */
export function useCopyRichContent(
	initContent?: RichContent,
	options?: UseCopyRichContentOptions,
): UseCopyRichContentResult {
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState<BrowserUtilsError | null>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const timeout = options?.timeout ?? 2000

	// Stable ref for onError — avoids re-creating copyRich when consumer passes
	// an inline arrow function as onError on every render.
	const onErrorRef = useRef(options?.onError)
	useEffect(() => {
		onErrorRef.current = options?.onError
	}, [options?.onError])

	// Unmount cleanup — clears any pending auto-reset timer.
	// This single empty-dep useEffect is ONLY for unmount cleanup.
	// Timer set/clear logic lives inside copyRich() itself (avoids stale closure issues
	// with useEffect [copied] dependency creating an off-by-one render lag).
	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current)
			}
		}
	}, [])

	const copyRich = useCallback(
		async (callContent?: RichContent): Promise<boolean> => {
			const content = callContent ?? initContent

			// D-02: no content at either init or call-site — programmer error.
			if (content === undefined) {
				throw new TypeError(
					'[ctc] useCopyRichContent: no content provided. Pass content at init or call-site.',
				)
			}

			// D-07: clear error before each attempt.
			setError(null)

			// Clear any in-flight auto-reset timer from a prior copy.
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}

			const success = await copyRichContent(content, {
				onError: (err) => {
					setError(err)
					onErrorRef.current?.(err)
				},
			})

			if (success) {
				setCopied(true)
				// D-05: timeout === 0 means never auto-reset.
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
		// onError is read via onErrorRef — no longer a dependency.
		// copyRich only re-creates when initContent or timeout changes.
		[initContent, timeout],
	)

	const reset = useCallback((): void => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		setCopied(false)
		setError(null)
	}, [])

	return { copyRich, copied, error, reset }
}
