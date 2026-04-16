/**
 * Error codes for browser utility operations.
 */
export type ErrorCode =
	| 'CLIPBOARD_NOT_SUPPORTED'
	| 'CLIPBOARD_PERMISSION_DENIED'
	| 'CLIPBOARD_WRITE_FAILED'
	| 'CLIPBOARD_READ_FAILED'
	| 'INSECURE_CONTEXT'
	| 'RICH_CLIPBOARD_NOT_SUPPORTED'

/**
 * Structured error for browser utility operations.
 *
 * All clipboard functions accept an optional `onError` callback
 * that receives this type with a specific error code.
 */
export interface BrowserUtilsError {
	code: ErrorCode
	message: string
	cause?: unknown
}

/**
 * Callback invoked when a browser utility operation fails.
 *
 * @param error - Structured error with code and message
 */
export type OnErrorCallback = (error: BrowserUtilsError) => void
