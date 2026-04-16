import { isBrowser, isSecureContext } from '../lib/env.ts'

/**
 * Check if rich clipboard operations (ClipboardItem API) are available.
 *
 * Returns `true` only when all conditions are met:
 * - Running in a browser environment (not SSR)
 * - Page is in a secure context (HTTPS or localhost)
 * - `ClipboardItem` constructor is available
 * - `navigator.clipboard.write` is a function
 *
 * @returns `true` if rich clipboard write/read operations are supported
 *
 * @remarks
 * Both `ClipboardItem` and `navigator.clipboard.write` are checked because
 * some environments may expose one without the other. Firefox may return
 * `false` by default if `dom.events.asyncClipboard.clipboardItem` is disabled.
 *
 * Permission state is not checked — a `true` result does not guarantee the
 * user has granted clipboard access.
 *
 * @example
 * ```ts
 * if (isRichClipboardSupported()) {
 *   await copyRichContent({ html: '<b>Hello</b>', text: 'Hello' })
 * } else {
 *   await copyToClipboard('Hello')
 * }
 * ```
 */
export function isRichClipboardSupported(): boolean {
	return (
		isBrowser() &&
		isSecureContext() &&
		typeof ClipboardItem !== 'undefined' &&
		typeof navigator.clipboard?.write === 'function'
	)
}
