import type { BrowserUtilsError, OnErrorCallback } from '@ngockhoi96/ctc'
import { copyRichContent } from '@ngockhoi96/ctc'
import type { Action, ActionReturn } from 'svelte/action'

/**
 * Parameters for the {@link copyRichAction} Svelte action.
 */
export interface CopyRichActionParams {
	/** HTML content copied to the clipboard when the bound element is clicked. */
	html: string
	/** Plain text content copied to the clipboard when the bound element is clicked. */
	text: string
	/** Optional callback invoked with a structured error on copy failure. */
	onError?: OnErrorCallback
}

/**
 * Custom event attribute typings dispatched by {@link copyRichAction}.
 *
 * Consumers can use `<button use:copyRichAction={{ html, text }} on:ctc:rich-copy={...}>`.
 */
interface CopyRichActionAttributes {
	'on:ctc:rich-copy'?: (e: CustomEvent<{ html: string; text: string }>) => void
	'on:ctc:rich-error'?: (e: CustomEvent<{ error: BrowserUtilsError }>) => void
}

/**
 * Svelte action that copies `params.html` and `params.text` to the clipboard
 * when the bound element is clicked. Dispatches bubbling `ctc:rich-copy` /
 * `ctc:rich-error` CustomEvents for state feedback (D-05).
 *
 * Implements `update()` so reactive content changes are picked up without
 * re-mounting the action (D-07), and `destroy()` to remove the click
 * listener on unmount (D-07). The action does NOT track copied state
 * internally — consumers needing copied state use `useCopyRichContent`
 * from the `/stores` or `/runes` subpath.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { copyRichAction } from '@ngockhoi96/ctc-svelte'
 *   let html = '<b>Hello</b>'
 *   let text = 'Hello'
 * </script>
 *
 * <button
 *   use:copyRichAction={{ html, text }}
 *   on:ctc:rich-copy={(e) => console.log('copied', e.detail.html)}
 *   on:ctc:rich-error={(e) => console.error(e.detail.error)}
 * >
 *   Copy
 * </button>
 * ```
 */
export const copyRichAction: Action<
	HTMLElement,
	CopyRichActionParams,
	CopyRichActionAttributes
> = (
	node,
	params,
): ActionReturn<CopyRichActionParams, CopyRichActionAttributes> => {
	let current: CopyRichActionParams = params

	async function handleClick(): Promise<void> {
		const success = await copyRichContent(
			{ html: current.html, text: current.text },
			{
				onError: (err) => {
					node.dispatchEvent(
						new CustomEvent('ctc:rich-error', {
							detail: { error: err },
							bubbles: true,
						}),
					)
					current.onError?.(err)
				},
			},
		)

		if (success) {
			node.dispatchEvent(
				new CustomEvent('ctc:rich-copy', {
					detail: { html: current.html, text: current.text },
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
