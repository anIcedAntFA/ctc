<script lang="ts">
import {
	type UseCopyRichContentOptions,
	type UseCopyRichContentResult,
	useCopyRichContent,
} from '../../src/runes/use-copy-rich-content.svelte.ts'

export let initContent: import('@ngockhoi96/ctc').RichContent | undefined = undefined
export let options: UseCopyRichContentOptions | undefined = undefined
export let onReady: (api: UseCopyRichContentResult) => void

const api = useCopyRichContent(initContent, options)
onReady(api)
</script>
