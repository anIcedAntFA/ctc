import { isBrowser, isSecureContext } from '../utils/env.ts'
import { createError, handleError } from '../utils/errors.ts'
import type { ClipboardOptions } from './types.ts'

/**
 * Read text from the clipboard using the modern Clipboard API.
 *
 * Requires a secure context (HTTPS or localhost). The browser may prompt
 * the user for permission on the first call.
 *
 * @param options - Optional configuration including `onError` callback
 * @returns The clipboard text on success, `null` on any failure (never throws)
 *
 * @remarks
 * **Permission prompt:** Chrome prompts for `clipboard-read` permission on
 * the first call. Firefox and Safari show a system-level paste prompt.
 * Permission denial is reported via `CLIPBOARD_PERMISSION_DENIED`.
 *
 * **Non-text content:** If the clipboard contains only non-text content
 * (e.g., an image), the browser throws `NotFoundError` which is reported
 * as `CLIPBOARD_READ_FAILED`.
 *
 * @example
 * ```ts
 * button.addEventListener('click', async () => {
 *   const text = await readFromClipboard()
 *   if (text !== null) {
 *     input.value = text
 *   }
 * })
 * ```
 */
export async function readFromClipboard(
	options?: ClipboardOptions,
): Promise<string | null> {
	if (!isBrowser()) {
		handleError(
			createError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment'),
			options?.onError,
		)
		return null
	}

	if (typeof navigator.clipboard?.readText !== 'function') {
		handleError(
			createError(
				'CLIPBOARD_NOT_SUPPORTED',
				'Clipboard read API not available',
			),
			options?.onError,
		)
		return null
	}

	if (!isSecureContext()) {
		handleError(
			createError(
				'INSECURE_CONTEXT',
				'Clipboard API requires a secure context (HTTPS)',
			),
			options?.onError,
		)
		return null
	}

	try {
		return await navigator.clipboard.readText()
	} catch (error) {
		const isPermissionDenied =
			error instanceof DOMException && error.name === 'NotAllowedError'

		if (isPermissionDenied) {
			handleError(
				createError(
					'CLIPBOARD_PERMISSION_DENIED',
					'Clipboard read permission denied',
					error,
				),
				options?.onError,
			)
		} else {
			handleError(
				createError(
					'CLIPBOARD_READ_FAILED',
					'Failed to read from clipboard',
					error,
				),
				options?.onError,
			)
		}
		return null
	}
}
