<script lang="ts">
import {
	type UseCopyToClipboardOptions,
	type UseCopyToClipboardResult,
	useCopyToClipboard,
} from '../../src/runes/use-copy-to-clipboard.svelte.ts'

export let initText: string | undefined = undefined
export let options: UseCopyToClipboardOptions | undefined = undefined
export let onReady: (api: UseCopyToClipboardResult) => void

const api = useCopyToClipboard(initText, options)
onReady(api)
</script>
