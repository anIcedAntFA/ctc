import { isClipboardReadSupported, isClipboardSupported } from '@ngockhoi96/ctc'
import { useCopyToClipboard } from '@ngockhoi96/ctc-react'
import { useEffect, useState } from 'react'

type DetectionState = {
	clipboardApi: boolean | null
	secureContext: boolean | null
	clipboardRead: boolean | null
}

export function App() {
	const [text, setText] = useState('Hello from @ngockhoi96/ctc-react')
	const { copy, copied, error } = useCopyToClipboard()
	const [detection, setDetection] = useState<DetectionState>({
		clipboardApi: null,
		secureContext: null,
		clipboardRead: null,
	})

	useEffect(() => {
		const clipboardApi = isClipboardSupported()
		const secureContext = window.isSecureContext
		const clipboardRead = isClipboardReadSupported()
		setDetection({ clipboardApi, secureContext, clipboardRead })
	}, [])

	const secure = detection.secureContext

	return (
		<div
			style={{
				fontFamily: 'system-ui, sans-serif',
				maxWidth: 600,
				margin: '2rem auto',
				padding: '0 1rem',
			}}
		>
			<h1 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
				@ngockhoi96/ctc -- React Playground
			</h1>

			<section style={{ marginBottom: '1.5rem' }}>
				<h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
					Copy to Clipboard
				</h2>
				<input
					type="text"
					value={text}
					onChange={(e) => setText(e.target.value)}
					style={{
						border: '1px solid #ccc',
						padding: '0.4rem 0.6rem',
						borderRadius: 4,
						width: '100%',
						boxSizing: 'border-box',
						marginBottom: '0.5rem',
					}}
				/>
				<button
					type="button"
					onClick={() => copy(text)}
					style={{
						padding: '0.4rem 1rem',
						borderRadius: 4,
						border: '1px solid #888',
						cursor: 'pointer',
						background: '#f4f4f4',
					}}
				>
					Copy
				</button>
				<div
					style={{
						marginTop: '0.4rem',
						fontSize: '0.875rem',
						minHeight: '1.25em',
					}}
				>
					{copied && <span style={{ color: 'green' }}>Copied!</span>}
					{!copied && error !== null && (
						<span style={{ color: 'red' }}>Error: {error.code}</span>
					)}
				</div>
			</section>

			<section style={{ marginBottom: '1.5rem' }}>
				<h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
					Secure Context
				</h2>
				{secure !== null && (
					<span
						style={{
							display: 'inline-block',
							padding: '0.2rem 0.5rem',
							borderRadius: 4,
							fontSize: '0.75rem',
							fontWeight: 'bold',
							background: secure ? '#d4edda' : '#f8d7da',
							color: secure ? '#155724' : '#721c24',
						}}
					>
						{secure ? 'Secure Context' : 'Insecure Context'}
					</span>
				)}
			</section>

			<section>
				<h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
					Detection Panel
				</h2>
				<table
					style={{
						borderCollapse: 'collapse',
						width: '100%',
						fontSize: '0.875rem',
					}}
				>
					<thead>
						<tr>
							<th
								style={{
									textAlign: 'left',
									padding: '0.3rem 0.5rem',
									background: '#f9f9f9',
									borderBottom: '1px solid #eee',
								}}
							>
								Function
							</th>
							<th
								style={{
									textAlign: 'left',
									padding: '0.3rem 0.5rem',
									background: '#f9f9f9',
									borderBottom: '1px solid #eee',
								}}
							>
								Result
							</th>
						</tr>
					</thead>
					<tbody>
						{[
							{
								label: 'isClipboardSupported()',
								value: detection.clipboardApi,
							},
							{
								label: 'isClipboardReadSupported()',
								value: detection.clipboardRead,
							},
							{
								label: 'window.isSecureContext',
								value: detection.secureContext,
							},
						].map(({ label, value }) => (
							<tr key={label}>
								<td
									style={{
										padding: '0.3rem 0.5rem',
										borderBottom: '1px solid #eee',
									}}
								>
									{label}
								</td>
								<td
									style={{
										padding: '0.3rem 0.5rem',
										borderBottom: '1px solid #eee',
									}}
								>
									{value === null ? 'checking...' : String(value)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	)
}
