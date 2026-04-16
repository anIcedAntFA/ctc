import type { BrowserUtilsError, ErrorCode, OnErrorCallback } from './types.ts'

/**
 * Error codes that represent expected, recoverable failures.
 *
 * Expected errors are logged with `console.warn`.
 * Unexpected errors are logged with `console.error`.
 *
 * @internal
 */
const EXPECTED_ERROR_CODES = new Set<ErrorCode>([
	'CLIPBOARD_NOT_SUPPORTED',
	'INSECURE_CONTEXT',
	'CLIPBOARD_PERMISSION_DENIED',
	'RICH_CLIPBOARD_NOT_SUPPORTED',
])

/**
 * Create a structured browser utils error.
 *
 * @param code - Error code identifying the failure type
 * @param message - Human-readable error description
 * @param cause - Original error that caused this failure
 * @returns A structured BrowserUtilsError object
 */
export function createError(
	code: ErrorCode,
	message: string,
	cause?: unknown,
): BrowserUtilsError {
	return { code, message, cause }
}

/**
 * Invoke the onError callback if provided, otherwise log a warning or error.
 *
 * Expected failures (CLIPBOARD_NOT_SUPPORTED, INSECURE_CONTEXT,
 * CLIPBOARD_PERMISSION_DENIED) are logged with `console.warn`.
 * Unexpected failures (CLIPBOARD_WRITE_FAILED, CLIPBOARD_READ_FAILED) are
 * logged with `console.error` and include the original cause for debugging.
 *
 * @param error - The structured error to handle
 * @param onError - Optional callback for error reporting
 */
export function handleError(
	error: BrowserUtilsError,
	onError?: OnErrorCallback,
): void {
	if (onError) {
		try {
			onError(error)
		} catch {
			// Consumer callback errors must not escape — the no-throw contract
			// applies to the full call stack originating from clipboard functions.
		}
		return
	}

	const prefix = '[ngockhoi96]'

	if (EXPECTED_ERROR_CODES.has(error.code)) {
		console.warn(`${prefix} ${error.code}: ${error.message}`)
	} else {
		console.error(`${prefix} ${error.code}: ${error.message}`, error.cause)
	}
}
