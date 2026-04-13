import {
	copyToClipboard,
	copyToClipboardLegacy,
	isClipboardReadSupported,
	isClipboardSupported,
	readFromClipboard,
} from '@ngockhoi96/ctc'

// Expose for E2E tests -- synchronous, top-level, unconditional (D-02)
// Shape must match the Window.__clipboard declaration in clipboard.spec.ts
;(
	window as Window & {
		__clipboard: {
			copyToClipboard: typeof copyToClipboard
			readFromClipboard: typeof readFromClipboard
			isClipboardSupported: typeof isClipboardSupported
			isClipboardReadSupported: typeof isClipboardReadSupported
			copyToClipboardLegacy: typeof copyToClipboardLegacy
		}
	}
).__clipboard = {
	copyToClipboard,
	readFromClipboard,
	isClipboardSupported,
	isClipboardReadSupported,
	copyToClipboardLegacy,
}

// Secure context badge (D-06) -- use browser native window.isSecureContext
const secureBadge = document.getElementById('secure-badge')!
const secure = window.isSecureContext
secureBadge.textContent = secure ? 'Secure Context' : 'Insecure Context'
secureBadge.classList.add(secure ? 'secure' : 'insecure')

// Detection panel (D-03) -- use DOM element creation, not innerHTML
type DetectionRow = { label: string; value: string | boolean }
const detectionRows: DetectionRow[] = [
	{ label: 'isClipboardSupported()', value: isClipboardSupported() },
	{
		label: 'isClipboardReadSupported()',
		value: isClipboardReadSupported(),
	},
	{ label: 'window.isSecureContext', value: window.isSecureContext },
]

const tbody = document.getElementById('detection-tbody')!

function renderDetection() {
	while (tbody.firstChild) tbody.removeChild(tbody.firstChild)
	for (const row of detectionRows) {
		const tr = document.createElement('tr')
		const tdLabel = document.createElement('td')
		tdLabel.textContent = row.label
		const tdValue = document.createElement('td')
		tdValue.textContent = String(row.value)
		tr.appendChild(tdLabel)
		tr.appendChild(tdValue)
		tbody.appendChild(tr)
	}
}

renderDetection()

// Copy button interaction (D-06)
const copyBtn = document.getElementById('copy-btn')!
const copyInput = document.getElementById('copy-input') as HTMLInputElement
const feedback = document.getElementById('feedback')!
let resetTimer: ReturnType<typeof setTimeout> | null = null

copyBtn.addEventListener('click', async () => {
	const text = copyInput.value
	const success = await copyToClipboard(text, {
		onError: (code) => {
			feedback.textContent = `Error: ${code}`
			feedback.className = 'error'
		},
	})
	if (success) {
		feedback.textContent = 'Copied!'
		feedback.className = 'copied'
		if (resetTimer !== null) clearTimeout(resetTimer)
		resetTimer = setTimeout(() => {
			feedback.textContent = ''
			feedback.className = ''
			resetTimer = null
		}, 2000)
	}
})
