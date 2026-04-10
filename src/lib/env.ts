/**
 * Check if code is running in a browser environment.
 *
 * @returns `true` if `navigator` and `window` are defined
 */
export function isBrowser(): boolean {
	return typeof navigator !== 'undefined' && typeof window !== 'undefined'
}

/**
 * Check if the current context is secure (HTTPS or localhost).
 *
 * Clipboard API requires a secure context in modern browsers.
 *
 * @returns `true` if running in a browser with a secure context
 */
export function isSecureContext(): boolean {
	return isBrowser() && window.isSecureContext === true
}
