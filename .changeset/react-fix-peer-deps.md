---
"@ngockhoi96/ctc-react": "patch"
---

Remove unnecessary `react-dom` peer dependency — the hook only uses React core (`useState`, `useCallback`, `useEffect`, `useRef`) and never imports from `react-dom`. Add `homepage` field to package.json.
