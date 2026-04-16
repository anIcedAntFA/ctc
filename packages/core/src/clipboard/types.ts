import type { OnErrorCallback } from '../lib/types.ts'

/**
 * Options for clipboard operations.
 */
export interface ClipboardOptions {
	/**
	 * Callback invoked when the clipboard operation fails.
	 * Receives a structured error with a specific error code.
	 */
	onError?: OnErrorCallback | undefined
}

/**
 * Content for rich clipboard operations containing both HTML and plain text.
 *
 * Both fields are required — callers must provide explicit HTML and plain text
 * representations. No auto-stripping or conversion is performed.
 */
export interface RichContent {
	/** HTML content to write to the clipboard as `text/html` MIME type */
	html: string
	/** Plain text content to write to the clipboard as `text/plain` MIME type */
	text: string
}
