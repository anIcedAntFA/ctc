import type { App } from 'vue'
import { createApp } from 'vue'

/**
 * Run a composable inside a minimal Vue component context.
 *
 * Required for composables that use lifecycle hooks (onMounted, onUnmounted, etc.).
 * Creates a real Vue app, mounts it on an in-memory div, and captures the composable's
 * return value.
 *
 * Returns a tuple of [result, app]. Call `app.unmount()` to trigger onUnmounted cleanup.
 *
 * @example
 * ```typescript
 * const [{ copy, copied }, app] = withSetup(() => useCopyToClipboard('hello'))
 * await copy()
 * expect(copied.value).toBe(true)
 * app.unmount() // triggers onUnmounted
 * ```
 */
export function withSetup<T>(composable: () => T): [result: T, app: App] {
	let result!: T

	const app = createApp({
		setup() {
			result = composable()
			// Suppress Vue template warning — we don't need a real template
			return (): null => null
		},
	})

	app.mount(document.createElement('div'))

	return [result, app]
}
