<script lang="ts">
  import type { OnErrorCallback } from '@ngockhoi96/ctc'
  import { copyAction } from '../../src/action/copy-action.ts'

  export let text: string
  export let onError: OnErrorCallback | undefined = undefined
</script>

<button use:copyAction={{ text, onError }}>Copy</button>
