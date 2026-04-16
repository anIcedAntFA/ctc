import { isBrowser, isSecureContext } from '../lib/env.ts'
import { createError, handleError } from '../lib/errors.ts'
import type { ClipboardOptions, RichContent } from './types.ts'

/**
 * Copy rich content (HTML + plain text) to the clipboard using the ClipboardItem API.
 *
 * Writes both `text/html` and `text/plain` MIME entries to the clipboard in a single
 * operation. Requires a secure context (HTTPS or localhost) and must be called from
 * within a user gesture handler (click, keydown, etc.).
 *
 * @param content - Object containing `html` and `text` fields, both required
 * @param options - Optional configuration including `onError` callback
 * @returns `true` on success, `false` on any failure (never throws)
 *
 * @remarks
 * **User gesture requirement:** Must be called synchronously within a user
 * gesture handler. Safari's clipboard permission window only lasts for the
 * synchronous user-gesture frame — avoid async work before this call.
 *
 * **Dual MIME:** Both `text/html` and `text/plain` are always written together.
 * Callers must provide both representations explicitly — no auto-stripping is performed.
 *
 * **Browser support:** Requires `ClipboardItem` API. Firefox may need the
 * `dom.events.asyncClipboard.clipboardItem` preference enabled. Use
 * `isRichClipboardSupported()` to check before calling.
 *
 * @example
 * ```ts
 * button.addEventListener('click', async () => {
 *   const success = await copyRichContent({
 *     html: '<b>Hello</b>, world!',
 *     text: 'Hello, world!',
 *   })
 *   if (!success) {
 *     showError('Rich copy failed')
 *   }
 * })
 * ```
 */
export async function copyRichContent(
	content: RichContent,
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

	if (
		typeof ClipboardItem === 'undefined' ||
		typeof navigator.clipboard?.write !== 'function'
	) {
		handleError(
			createError(
				'RICH_CLIPBOARD_NOT_SUPPORTED',
				'ClipboardItem API is not available',
			),
			options?.onError,
		)
		return false
	}

	try {
		const item = new ClipboardItem({
			'text/html': new Blob([content.html], { type: 'text/html' }),
			'text/plain': new Blob([content.text], { type: 'text/plain' }),
		})
		await navigator.clipboard.write([item])
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
					'Failed to write rich content to clipboard',
					error,
				),
				options?.onError,
			)
		}
		return false
	}
}
