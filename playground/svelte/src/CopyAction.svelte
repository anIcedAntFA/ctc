<script lang="ts">
  import type { BrowserUtilsError } from '@ngockhoi96/ctc-svelte'
  import { copyAction } from '@ngockhoi96/ctc-svelte'

  let text = $state('Hello from copyAction')
  let feedback = $state<string | null>(null)
  let feedbackType = $state<'copied' | 'error' | null>(null)
  let resetTimer: ReturnType<typeof setTimeout> | null = null
  let buttonEl = $state<HTMLButtonElement | null>(null)

  function onCopy() {
    feedback = 'Copied!'
    feedbackType = 'copied'
    if (resetTimer !== null) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      feedback = null
      feedbackType = null
      resetTimer = null
    }, 2000)
  }

  function onError(event: Event) {
    const err = (event as CustomEvent<{ error: BrowserUtilsError }>).detail.error
    feedback = `Error: ${err.code}`
    feedbackType = 'error'
  }

  // In Svelte 5 colon-containing event names cannot be used as template attributes.
  // Attach listeners programmatically via $effect (Svelte 5 pattern).
  $effect(() => {
    if (buttonEl === null) return
    buttonEl.addEventListener('ctc:copy', onCopy)
    buttonEl.addEventListener('ctc:error', onError)
    return () => {
      buttonEl?.removeEventListener('ctc:copy', onCopy)
      buttonEl?.removeEventListener('ctc:error', onError)
    }
  })
</script>

<div class="panel">
  <h2>copyAction (use: directive)</h2>
  <input type="text" bind:value={text} />
  <button bind:this={buttonEl} use:copyAction={{ text }}>
    Copy
  </button>
  <div class="feedback" class:copied={feedbackType === 'copied'} class:error={feedbackType === 'error'}>
    {feedback ?? ''}
  </div>
</div>

<style>
  .panel { padding: 1rem; border: 1px solid #e0e0e0; border-radius: 6px; }
  h2 { font-size: 1rem; margin-bottom: 0.5rem; }
  input {
    border: 1px solid #ccc;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 0.5rem;
  }
  button {
    padding: 0.4rem 1rem;
    border-radius: 4px;
    border: 1px solid #888;
    cursor: pointer;
    background: #f4f4f4;
  }
  button:hover { background: #e0e0e0; }
  .feedback { margin-top: 0.4rem; font-size: 0.875rem; min-height: 1.25em; }
  .copied { color: green; }
  .error { color: red; }
</style>
