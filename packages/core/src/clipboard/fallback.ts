import { isBrowser } from '../lib/env.ts'
import { createError, handleError } from '../lib/errors.ts'
import type { ClipboardOptions } from './types.ts'

/**
 * Copy text to the clipboard using the legacy `document.execCommand` API.
 *
 * Use this function when the modern Clipboard API is unavailable — for
 * example, on HTTP pages (non-HTTPS) or in browsers that do not support
 * `navigator.clipboard`. For HTTPS pages, prefer `copyToClipboard()`.
 *
 * @param text - The text to copy to the clipboard
 * @param options - Optional configuration including `onError` callback
 * @returns `true` on success, `false` on any failure (never throws)
 *
 * @remarks
 * This function uses the deprecated `document.execCommand('copy')` API,
 * which is synchronous and text-only. It temporarily creates and removes a
 * textarea element in the DOM to perform the copy operation.
 *
 * **No secure context requirement:** This function works on HTTP pages.
 * This is by design — it exists for environments where `copyToClipboard()`
 * is unavailable due to missing secure context.
 *
 * **iOS Safari:** `execCommand` copy is not reliably supported on iOS.
 * This function may return `false` on iOS Safari without a usable fallback.
 *
 * @example
 * ```ts
 * if (isClipboardSupported()) {
 *   await copyToClipboard(text)
 * } else {
 *   const success = copyToClipboardLegacy(text)
 *   if (!success) {
 *     showManualCopyInstructions()
 *   }
 * }
 * ```
 */
export function copyToClipboardLegacy(
	text: string,
	options?: ClipboardOptions,
): boolean {
	if (!isBrowser()) {
		handleError(
			createError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment'),
			options?.onError,
		)
		return false
	}

	if (!document.body) {
		handleError(
			createError('CLIPBOARD_NOT_SUPPORTED', 'document.body is not available'),
			options?.onError,
		)
		return false
	}

	const textarea = document.createElement('textarea')

	// Position off-screen but visible to the browser — required for text selection on iOS.
	// display:none or visibility:hidden prevents the browser from selecting the content.
	textarea.style.position = 'fixed'
	textarea.style.top = '0'
	textarea.style.left = '0'
	textarea.style.opacity = '0'
	textarea.style.pointerEvents = 'none'
	// Prevent iOS Safari from auto-zooming when the textarea is focused
	textarea.style.fontSize = '16px'
	// Prevent the mobile keyboard from appearing during the copy operation
	textarea.readOnly = true
	textarea.value = text

	document.body.appendChild(textarea)

	try {
		textarea.focus()
		// setSelectionRange is more reliable than .select() on mobile browsers (Pitfall 3)
		textarea.setSelectionRange(0, text.length)

		const success = document.execCommand('copy')

		if (!success) {
			handleError(
				createError(
					'CLIPBOARD_WRITE_FAILED',
					'execCommand copy returned false',
				),
				options?.onError,
			)
			return false
		}

		return true
	} catch (error) {
		handleError(
			createError(
				'CLIPBOARD_WRITE_FAILED',
				'execCommand copy threw an error',
				error,
			),
			options?.onError,
		)
		return false
	} finally {
		// Guard with isConnected before removing — prevents NotFoundError if a
		// framework (e.g., React 18 Strict Mode) or MutationObserver removed the
		// node between appendChild and here. textarea.remove() does not throw on
		// already-detached nodes. (Pitfall 4)
		if (textarea.isConnected) {
			textarea.remove()
		}
	}
}
