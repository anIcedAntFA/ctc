<script lang="ts">
  import {
    isClipboardReadSupported,
    isClipboardSupported,
  } from '@ngockhoi96/ctc'
  import { onMount } from 'svelte'
  import CopyAction from './CopyAction.svelte'
  import CopyRune from './CopyRune.svelte'

  // Detection results — null means not yet evaluated
  type Detection = {
    clipboardApi: boolean | null
    clipboardRead: boolean | null
    secureContext: boolean | null
  }

  let detection = $state<Detection>({
    clipboardApi: null,
    clipboardRead: null,
    secureContext: null,
  })

  const secure = $derived(detection.secureContext)

  onMount(() => {
    detection.clipboardApi = isClipboardSupported()
    detection.clipboardRead = isClipboardReadSupported()
    // window.isSecureContext is a browser-native API (not exported from @ngockhoi96/ctc)
    detection.secureContext = window.isSecureContext
  })

  const detectionRows = [
    { key: 'clipboardApi' as const, label: 'isClipboardSupported()' },
    { key: 'clipboardRead' as const, label: 'isClipboardReadSupported()' },
    { key: 'secureContext' as const, label: 'window.isSecureContext' },
  ]
</script>

<div class="container">
  <h1>@ngockhoi96/ctc -- Svelte Playground</h1>

  <!-- Two-panel grid layout (D-04) -->
  <div class="panels-grid">
    <CopyAction />
    <CopyRune />
  </div>

  <!-- Shared bottom section -->
  <section class="shared">
    <div class="secure-section">
      <h2>Secure Context</h2>
      {#if secure !== null}
        <span class="badge" class:secure={secure} class:insecure={!secure}>
          {secure ? 'Secure Context' : 'Insecure Context'}
        </span>
      {/if}
    </div>

    <div class="detection-section">
      <h2>Detection Panel</h2>
      <table>
        <thead>
          <tr>
            <th>Function</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {#each detectionRows as row (row.key)}
            <tr>
              <td>{row.label}</td>
              <td>{detection[row.key] === null ? 'checking...' : String(detection[row.key])}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</div>

<style>
  .container {
    font-family: system-ui, sans-serif;
    max-width: 900px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  h1 { font-size: 1.25rem; margin-bottom: 1.5rem; }

  /* Two-column desktop layout (D-04) */
  .panels-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  /* Single-column mobile layout (D-04) */
  @media (max-width: 767px) {
    .panels-grid {
      grid-template-columns: 1fr;
    }
  }

  .shared { margin-top: 1rem; }
  .secure-section { margin-bottom: 1.5rem; }
  h2 { font-size: 1rem; margin-bottom: 0.5rem; }

  .badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
  }
  .secure { background: #d4edda; color: #155724; }
  .insecure { background: #f8d7da; color: #721c24; }

  table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
  th, td { text-align: left; padding: 0.3rem 0.5rem; border-bottom: 1px solid #eee; }
  th { background: #f9f9f9; }
</style>
