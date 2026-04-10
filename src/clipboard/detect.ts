import { isBrowser, isSecureContext } from '../lib/env.ts'

/**
 * Check if the Clipboard API is available and usable in the current context.
 *
 * Returns `true` only when `navigator.clipboard.writeText` exists AND the
 * page is running in a secure context (HTTPS or localhost). Returns `false`
 * in SSR environments, on HTTP pages, or when the Clipboard API is absent.
 *
 * @returns `true` if clipboard write operations are supported
 *
 * @remarks
 * Permission state is not checked — a `true` result does not guarantee the
 * user has granted clipboard access. Permission denial is surfaced at call
 * time via the `CLIPBOARD_PERMISSION_DENIED` error code on `copyToClipboard`.
 *
 * @example
 * ```ts
 * if (isClipboardSupported()) {
 *   await copyToClipboard(text)
 * } else {
 *   copyToClipboardLegacy(text)
 * }
 * ```
 */
export function isClipboardSupported(): boolean {
	return (
		isBrowser() &&
		isSecureContext() &&
		typeof navigator.clipboard?.writeText === 'function'
	)
}

/**
 * Check if clipboard read operations are available and usable in the current context.
 *
 * Returns `true` only when `navigator.clipboard.readText` exists AND the
 * page is running in a secure context (HTTPS or localhost). Returns `false`
 * in SSR environments, on HTTP pages, or when the read API is absent.
 *
 * @returns `true` if clipboard read operations are supported
 *
 * @remarks
 * Permission state is not checked — a `true` result does not guarantee the
 * user has granted clipboard read access. Permission denial is surfaced at
 * call time via the `CLIPBOARD_PERMISSION_DENIED` error code on `readFromClipboard`.
 *
 * Firefox does not support the Permissions API `clipboard-read` query. This
 * function uses synchronous feature detection only — no async permission
 * queries are performed.
 *
 * @example
 * ```ts
 * if (isClipboardReadSupported()) {
 *   const text = await readFromClipboard()
 * }
 * ```
 */
export function isClipboardReadSupported(): boolean {
	return (
		isBrowser() &&
		isSecureContext() &&
		typeof navigator.clipboard?.readText === 'function'
	)
}
