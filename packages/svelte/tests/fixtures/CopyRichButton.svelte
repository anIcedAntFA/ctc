<script lang="ts">
import type { OnErrorCallback } from '@ngockhoi96/ctc'
// biome-ignore lint/correctness/noUnusedImports: used as Svelte action directive (use:copyRichAction)
import { copyRichAction } from '../../src/action/copy-rich-action.ts'

export let html: string
export let text: string
export let onError: OnErrorCallback | undefined = undefined
</script>

<button use:copyRichAction={{ html, text, onError }}>Copy Rich</button>
