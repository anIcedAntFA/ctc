import { isBrowser, isSecureContext } from '../lib/env.ts'
import { createError, handleError } from '../lib/errors.ts'
import type { ClipboardOptions } from './types.ts'

/**
 * Copy text to the clipboard using the modern Clipboard API.
 *
 * Requires a secure context (HTTPS or localhost) and must be called from
 * within a user gesture handler (click, keydown, etc.).
 *
 * @param text - The text to copy to the clipboard
 * @param options - Optional configuration including `onError` callback
 * @returns `true` on success, `false` on any failure (never throws)
 *
 * @remarks
 * **User gesture requirement:** Must be called synchronously within a user
 * gesture handler. Programmatic calls from timers or microtasks will be
 * rejected by the browser with `CLIPBOARD_PERMISSION_DENIED`.
 *
 * **Secure context:** Returns `false` on HTTP pages with `INSECURE_CONTEXT`
 * error code. Use `copyToClipboardLegacy()` for HTTP environments.
 *
 * **Safari:** Calling any async operation before `writeText()` in the same
 * microtask may break Safari's user activation window. Keep the call
 * synchronous within the click handler.
 *
 * @example
 * ```ts
 * button.addEventListener('click', async () => {
 *   const success = await copyToClipboard('Hello, world!')
 *   if (!success) {
 *     showError('Copy failed — check HTTPS and permissions')
 *   }
 * })
 * ```
 */
export async function copyToClipboard(
	text: string,
	options?: ClipboardOptions,
): Promise<boolean> {
	if (!isBrowser()) {
		handleError(
			createError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment'),
			options?.onError,
		)
		return false
	}

	if (!isSecureContext()) {
		handleError(
			createError(
				'INSECURE_CONTEXT',
				'Clipboard API requires a secure context (HTTPS)',
			),
			options?.onError,
		)
		return false
	}

	if (typeof navigator.clipboard?.writeText !== 'function') {
		handleError(
			createError('CLIPBOARD_NOT_SUPPORTED', 'Clipboard API not available'),
			options?.onError,
		)
		return false
	}

	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch (error) {
		const isPermissionDenied =
			error instanceof DOMException && error.name === 'NotAllowedError'

		if (isPermissionDenied) {
			handleError(
				createError(
					'CLIPBOARD_PERMISSION_DENIED',
					'Clipboard write permission denied',
					error,
				),
				options?.onError,
			)
		} else {
			handleError(
				createError(
					'CLIPBOARD_WRITE_FAILED',
					'Failed to write to clipboard',
					error,
				),
				options?.onError,
			)
		}
		return false
	}
}
