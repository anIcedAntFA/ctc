# @ngockhoi96/ctc-react

## 0.1.0

### Minor Changes

- ✨ [#8](https://github.com/anIcedAntFA/ctc/pull/8) [`09ca8e6`](https://github.com/anIcedAntFA/ctc/commit/09ca8e6c4e3a70f069f6817e77fc88d7839c8aeb) Thanks [@anIcedAntFA](https://github.com/anIcedAntFA)! - feat(react): initial release of `@ngockhoi96/ctc-react` — React hook for clipboard copy

  Introduces the first stable API for the React adapter package. Built on top of `@ngockhoi96/ctc` core with full React state integration, auto-reset timer, and structured error handling.

  ## New export: `useCopyToClipboard`

  ```ts
  function useCopyToClipboard(
    initText?: string,
    options?: UseCopyToClipboardOptions
  ): UseCopyToClipboardResult;
  ```

  A React hook that wraps `copyToClipboard` from `@ngockhoi96/ctc` and manages `copied`/`error` state for you.

  **Parameters:**

  - `initText` — Text to copy. Optional at init; can be overridden per `copy()` call.
  - `options.timeout` — Milliseconds before `copied` auto-resets to `false` after a successful copy. Defaults to `2000`. Set to `0` to disable auto-reset.
  - `options.onError` — Callback receiving a `BrowserUtilsError` on failure (inherited from `ClipboardOptions`).

  **Returns `{ copy, copied, error, reset }`:**

  | Field    | Type                                  | Description                                                                                                 |
  | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
  | `copy`   | `(text?: string) => Promise<boolean>` | Trigger a copy. Per-call `text` overrides `initText`. Returns `true` on success.                            |
  | `copied` | `boolean`                             | `true` immediately after a successful copy; auto-resets after `timeout` ms.                                 |
  | `error`  | `BrowserUtilsError \| null`           | Structured error from the most recent failed attempt. Cleared to `null` at the start of each `copy()` call. |
  | `reset`  | `() => void`                          | Immediately resets `copied` to `false`, `error` to `null`, and cancels any pending auto-reset timer.        |

  **Example:**

  ```tsx
  import { useCopyToClipboard } from "@ngockhoi96/ctc-react";

  function CopyButton({ text }: { text: string }) {
    const { copy, copied, error } = useCopyToClipboard(text, { timeout: 1500 });

    return (
      <button onClick={() => copy()} disabled={copied}>
        {copied ? "Copied!" : "Copy"}
        {error && <span>Failed: {error.code}</span>}
      </button>
    );
  }
  ```

  ## New types exported

  - `UseCopyToClipboardOptions` — Options interface extending `ClipboardOptions`
  - `UseCopyToClipboardResult` — Return shape of the hook

  Re-exports from `@ngockhoi96/ctc` core for convenience:

  - `BrowserUtilsError`, `ClipboardOptions`, `ErrorCode`, `OnErrorCallback`

  ## Peer dependencies

  - `@ngockhoi96/ctc >= 0.1.0`
  - `react >= 18 < 20`
  - `react-dom >= 18 < 20`
