<script setup lang="ts">
import {
  isClipboardReadSupported,
  isClipboardSupported,
} from '@ngockhoi96/ctc'
import { useCopyToClipboard } from '@ngockhoi96/ctc-vue'
import { onMounted, ref } from 'vue'

const text = ref('Hello from @ngockhoi96/ctc-vue')
const { copy, copied, error } = useCopyToClipboard()

type Detection = {
  clipboardApi: boolean | null
  clipboardRead: boolean | null
  secureContext: boolean | null
}

const detection = ref<Detection>({
  clipboardApi: null,
  clipboardRead: null,
  secureContext: null,
})

onMounted(() => {
  detection.value.clipboardApi = isClipboardSupported()
  detection.value.clipboardRead = isClipboardReadSupported()
  detection.value.secureContext = window.isSecureContext
})

const detectionRows = [
  { key: 'clipboardApi' as const, label: 'isClipboardSupported()' },
  { key: 'clipboardRead' as const, label: 'isClipboardReadSupported()' },
  { key: 'secureContext' as const, label: 'window.isSecureContext' },
]
</script>

<template>
  <div class="container">
    <h1>@ngockhoi96/ctc -- Vue Playground</h1>

    <section>
      <h2>Copy to Clipboard</h2>
      <input v-model="text" type="text" />
      <button @click="copy(text)">Copy</button>
      <div class="feedback">
        <span v-if="copied" class="copied">Copied!</span>
        <span v-else-if="error !== null" class="error">Error: {{ error?.code }}</span>
      </div>
    </section>

    <section>
      <h2>Secure Context</h2>
      <span
        v-if="detection.secureContext !== null"
        class="badge"
        :class="detection.secureContext ? 'secure' : 'insecure'"
      >
        {{ detection.secureContext ? 'Secure Context' : 'Insecure Context' }}
      </span>
    </section>

    <section>
      <h2>Detection Panel</h2>
      <table>
        <thead>
          <tr>
            <th>Function</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in detectionRows" :key="row.key">
            <td>{{ row.label }}</td>
            <td>{{ detection[row.key] === null ? 'checking...' : String(detection[row.key]) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.container {
  font-family: system-ui, sans-serif;
  max-width: 600px;
  margin: 2rem auto;
  padding: 0 1rem;
}
h1 { font-size: 1.25rem; margin-bottom: 1.5rem; }
section { margin-bottom: 1.5rem; }
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
