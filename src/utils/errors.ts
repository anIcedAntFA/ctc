import type { BrowserUtilsError, ErrorCode, OnErrorCallback } from './types.ts'

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
 * Invoke the onError callback if provided, otherwise log a warning.
 *
 * @param error - The structured error to handle
 * @param onError - Optional callback for error reporting
 */
export function handleError(
	error: BrowserUtilsError,
	onError?: OnErrorCallback,
): void {
	if (onError) {
		onError(error)
	} else {
		console.warn(`[browser-utils] ${error.code}: ${error.message}`)
	}
}
