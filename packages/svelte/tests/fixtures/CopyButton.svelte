<script lang="ts">
import type { OnErrorCallback } from '@ngockhoi96/ctc'
// biome-ignore lint/correctness/noUnusedImports: used as Svelte action directive (use:copyAction)
import { copyAction } from '../../src/action/copy-action.ts'

export let text: string
export let onError: OnErrorCallback | undefined = undefined
</script>

<button use:copyAction={{ text, onError }}>Copy</button>
