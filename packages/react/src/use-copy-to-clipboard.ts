import type { BrowserUtilsError, ClipboardOptions } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Options for useCopyToClipboard.
 * Extends ClipboardOptions (which provides onError callback).
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
 */
export interface UseCopyToClipboardResult {
	/**
	 * Trigger a clipboard copy. Accepts optional text that overrides the init-time
	 * text. Returns `true` on success, `false` on failure.
	 */
	copy: (text?: string) => Promise<boolean>
	/** `true` immediately after a successful copy; resets after `timeout` ms. */
	copied: boolean
	/**
	 * Structured error from the most recent failed copy attempt.
	 * `null` when no error. Cleared to `null` at the start of each `copy()` call.
	 */
	error: BrowserUtilsError | null
	/**
	 * Immediately resets `copied` to `false` and `error` to `null`.
	 * Also cancels any pending auto-reset timer.
	 */
	reset: () => void
}

/**
 * React hook for clipboard copy with managed `copied` and `error` state.
 *
 * @param initText - Text to copy. Can be overridden per `copy()` call.
 * @param options - Optional configuration: `timeout` and `onError`.
 * @returns `{ copy, copied, error, reset }`
 *
 * @example
 * ```tsx
 * const { copy, copied, error } = useCopyToClipboard('Hello world')
 * <button onClick={() => copy()}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 * ```
 */
export function useCopyToClipboard(
	initText?: string,
	options?: UseCopyToClipboardOptions,
): UseCopyToClipboardResult {
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState<BrowserUtilsError | null>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const timeout = options?.timeout ?? 2000

	// Unmount cleanup — clears any pending auto-reset timer.
	// This single empty-dep useEffect is ONLY for unmount cleanup.
	// Timer set/clear logic lives inside copy() itself (avoids stale closure issues
	// with useEffect [copied] dependency creating an off-by-one render lag).
	useEffect(() => {
		return () => {
			if (timerRef.current !== null) {
				clearTimeout(timerRef.current)
			}
		}
	}, [])

	const copy = useCallback(
		async (callText?: string): Promise<boolean> => {
			const text = callText ?? initText

			// D-02: no text at either init or call-site — programmer error.
			if (text === undefined) {
				const err: BrowserUtilsError = {
					code: 'CLIPBOARD_NOT_SUPPORTED',
					message: 'No text provided to copy. Pass text at init or call-site.',
				}
				setError(err)
				options?.onError?.(err)
				return false
			}

			// D-07: clear error before each attempt.
			setError(null)

			// Clear any in-flight auto-reset timer from a prior copy.
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
		// options?.onError is captured — consumers should memoize onError with
		// useCallback if they need a stable copy reference.
		[initText, timeout, options?.onError],
	)

	const reset = useCallback((): void => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		setCopied(false)
		setError(null)
	}, [])

	return { copy, copied, error, reset }
}
