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
