import { isBrowser, isSecureContext } from '../lib/env.ts'
import { createError, handleError } from '../lib/errors.ts'
import type { ClipboardOptions } from './types.ts'

/**
 * Read rich content (HTML + plain text) from the clipboard using the ClipboardItem API.
 *
 * Returns an object with `html` and `text` fields. A `null` field means that MIME type
 * was not present in the clipboard (not a failure). Returns `null` (not the object) on
 * complete failure — permission denied, insecure context, or API unavailable.
 *
 * @param options - Optional configuration including `onError` callback
 * @returns `{ html: string | null, text: string | null }` on success, `null` on failure
 *
 * @remarks
 * **Two-level null check:** `result === null` means the operation failed entirely.
 * `result.html === null` means the read succeeded but the clipboard held no HTML content.
 *
 * **Permission prompt:** The browser may prompt for clipboard-read permission on the
 * first call. Permission denial is reported via `CLIPBOARD_PERMISSION_DENIED`.
 *
 * **HTML sanitization:** Chrome sanitizes HTML read from clipboard by default (strips
 * `<script>` tags). The returned `html` field contains sanitized content.
 *
 * **Browser support:** Requires `ClipboardItem` API. Firefox may need the
 * `dom.events.asyncClipboard.clipboardItem` preference enabled. Use
 * `isRichClipboardSupported()` to check before calling.
 *
 * @example
 * ```ts
 * button.addEventListener('click', async () => {
 *   const result = await readRichContent()
 *   if (result === null) {
 *     showError('Could not read clipboard')
 *     return
 *   }
 *   if (result.html) {
 *     editor.setHTML(result.html)
 *   } else if (result.text) {
 *     editor.setText(result.text)
 *   }
 * })
 * ```
 */
export async function readRichContent(
	options?: ClipboardOptions,
): Promise<{ html: string | null; text: string | null } | null> {
	if (!isBrowser()) {
		handleError(
			createError('CLIPBOARD_NOT_SUPPORTED', 'Not in a browser environment'),
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

	if (
		typeof ClipboardItem === 'undefined' ||
		typeof navigator.clipboard?.read !== 'function'
	) {
		handleError(
			createError(
				'RICH_CLIPBOARD_NOT_SUPPORTED',
				'ClipboardItem API is not available',
			),
			options?.onError,
		)
		return null
	}

	try {
		const items = await navigator.clipboard.read()
		const result: { html: string | null; text: string | null } = {
			html: null,
			text: null,
		}

		for (const item of items) {
			try {
				const htmlBlob = await item.getType('text/html')
				result.html = await htmlBlob.text()
			} catch {
				// text/html not present in this item — leave null
			}

			try {
				const textBlob = await item.getType('text/plain')
				result.text = await textBlob.text()
			} catch {
				// text/plain not present in this item — leave null
			}
		}

		return result
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
					'Failed to read rich content from clipboard',
					error,
				),
				options?.onError,
			)
		}
		return null
	}
}
