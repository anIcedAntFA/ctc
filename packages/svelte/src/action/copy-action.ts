import type { BrowserUtilsError, OnErrorCallback } from '@ngockhoi96/ctc'
import { copyToClipboard } from '@ngockhoi96/ctc'
import type { Action, ActionReturn } from 'svelte/action'

/**
 * Parameters for the {@link copyAction} Svelte action.
 */
export interface CopyActionParams {
	/** Text copied to the clipboard when the bound element is clicked. */
	text: string
	/** Optional callback invoked with a structured error on copy failure. */
	onError?: OnErrorCallback
}

/**
 * Custom event attribute typings dispatched by {@link copyAction}.
 *
 * Consumers can use `<button use:copyAction={{ text }} on:ctc:copy={...}>`.
 */
interface CopyActionAttributes {
	'on:ctc:copy'?: (e: CustomEvent<{ text: string }>) => void
	'on:ctc:error'?: (e: CustomEvent<{ error: BrowserUtilsError }>) => void
}

/**
 * Svelte action that copies `params.text` to the clipboard when the bound
 * element is clicked. Dispatches bubbling `ctc:copy` / `ctc:error`
 * CustomEvents for state feedback (D-08, D-09).
 *
 * Implements `update()` so reactive `text` changes are picked up without
 * re-mounting the action (D-06), and `destroy()` to remove the click
 * listener on unmount (D-07). The action does NOT track copied state
 * internally — consumers needing copied state use `useCopyToClipboard`
 * from the `/stores` or `/runes` subpath (D-11).
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { copyAction } from '@ngockhoi96/ctc-svelte'
 *   let text = 'Hello'
 * </script>
 *
 * <button
 *   use:copyAction={{ text }}
 *   on:ctc:copy={(e) => console.log('copied', e.detail.text)}
 *   on:ctc:error={(e) => console.error(e.detail.error)}
 * >
 *   Copy
 * </button>
 * ```
 */
export const copyAction: Action<
	HTMLElement,
	CopyActionParams,
	CopyActionAttributes
> = (node, params): ActionReturn<CopyActionParams, CopyActionAttributes> => {
	let current: CopyActionParams = params

	async function handleClick(): Promise<void> {
		// `copyToClipboard` returns a boolean only — the structured error is
		// delivered through `onError`. Wrap the user's onError so we can
		// dispatch `ctc:error` with the BrowserUtilsError as the event detail
		// (Pitfall 1) and still forward the error to the user-supplied callback.
		const success = await copyToClipboard(current.text, {
			onError: (err) => {
				node.dispatchEvent(
					new CustomEvent('ctc:error', {
						detail: { error: err },
						bubbles: true,
					}),
				)
				current.onError?.(err)
			},
		})

		if (success) {
			node.dispatchEvent(
				new CustomEvent('ctc:copy', {
					detail: { text: current.text },
					bubbles: true,
				}),
			)
		}
	}

	node.addEventListener('click', handleClick)

	return {
		update(newParams) {
			current = newParams
		},
		destroy() {
			node.removeEventListener('click', handleClick)
		},
	}
}
