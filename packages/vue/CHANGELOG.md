# @ngockhoi96/ctc-vue

## 0.1.0

### Minor Changes

- ✨ [`e9257f4`](https://github.com/anIcedAntFA/ctc/commit/e9257f4450606fe36f05d26fa45df554252d599f) Thanks [@anIcedAntFA](https://github.com/anIcedAntFA)! - feat(vue): initial release of `@ngockhoi96/ctc-vue` — Vue 3 composable for clipboard copy

  Introduces the first stable API for the Vue 3 adapter package. Built on top of `@ngockhoi96/ctc` core with full Vue reactivity integration via shallow refs, auto-reset timer, and structured error handling.

  ## New export: `useCopyToClipboard`

  ```ts
  function useCopyToClipboard(
    initText?: string,
    options?: UseCopyToClipboardOptions
  ): UseCopyToClipboardResult;
  ```

  A Vue 3 composable that wraps `copyToClipboard` from `@ngockhoi96/ctc` and manages `copied` / `error` as Vue `ShallowRef` values.

  **Parameters:**

  - `initText` — Text to copy. Optional at init; can be overridden per `copy()` call.
  - `options.timeout` — Milliseconds before `copied` auto-resets to `false` after a successful copy. Defaults to `2000`. Set to `0` to disable auto-reset.
  - `options.onError` — Callback receiving a `BrowserUtilsError` on failure (inherited from `ClipboardOptions`).

  **Returns `{ copy, copied, error, reset }`:**

  | Field    | Type                                    | Description                                                                                                       |
  | -------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
  | `copy`   | `(text?: string) => Promise<boolean>`   | Trigger a copy. Per-call `text` overrides `initText`. Returns `true` on success.                                  |
  | `copied` | `ShallowRef<boolean>`                   | `true` immediately after a successful copy; auto-resets after `timeout` ms. Unwrapped automatically in templates. |
  | `error`  | `ShallowRef<BrowserUtilsError \| null>` | Structured error from the most recent failed attempt. Cleared to `null` at the start of each `copy()` call.       |
  | `reset`  | `() => void`                            | Immediately resets `copied.value` to `false`, `error.value` to `null`, and cancels any pending auto-reset timer.  |

  **Example:**

  ```vue
  <script setup lang="ts">
  import { useCopyToClipboard } from "@ngockhoi96/ctc-vue";

  const { copy, copied, error } = useCopyToClipboard("Hello, world!", {
    timeout: 1500,
  });
  </script>

  <template>
    <button @click="copy()" :disabled="copied">
      {{ copied ? "Copied!" : "Copy" }}
    </button>
    <span v-if="error">Failed: {{ error.code }}</span>
  </template>
  ```

  ## New types exported

  - `UseCopyToClipboardOptions` — Options interface extending `ClipboardOptions`
  - `UseCopyToClipboardResult` — Return shape of the composable

  Re-exports from `@ngockhoi96/ctc` core for convenience:

  - `BrowserUtilsError`, `ClipboardOptions`, `ErrorCode`, `OnErrorCallback`

  ## Peer dependencies

  - `@ngockhoi96/ctc >= 0.1.0`
  - `vue >= 3.0.0 < 4.0.0`

  ## SSR safety

  The composable is SSR-safe. `copyToClipboard` from core returns `false` immediately in non-browser environments. `onUnmounted` is a no-op on the server — no timer cleanup issues in Nuxt SSR or similar environments.

## 0.0.2

### Patch Changes

- Updated dependencies [[`7b4cbbc`](https://github.com/anIcedAntFA/ctc/commit/7b4cbbc4287830391b41a1dc26b069bbd8c11e61)]:
  - @ngockhoi96/ctc@0.2.2
