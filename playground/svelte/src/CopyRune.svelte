<script lang="ts">
  import { useCopyToClipboard } from '@ngockhoi96/ctc-svelte/runes'

  let text = $state('Hello from useCopyToClipboard (runes)')
  // MUST be top-level — useCopyToClipboard uses $effect internally (Pitfall 7)
  // Pass undefined for initText — copy(text) is called with the reactive value each time
  const ctc = useCopyToClipboard()
</script>

<div class="panel">
  <h2>useCopyToClipboard (runes)</h2>
  <input type="text" bind:value={text} />
  <button onclick={() => ctc.copy(text)}>Copy</button>
  <div class="feedback" class:copied={ctc.copied} class:error={ctc.error !== null}>
    {#if ctc.copied}
      Copied!
    {:else if ctc.error !== null}
      Error: {ctc.error.code}
    {/if}
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
