import { bench, describe } from 'vitest'
import { copyRichContent, copyToClipboard, readFromClipboard } from '@ngockhoi96/ctc'
import {
	createClipboardMock,
	createReadClipboardMock,
	createRichClipboardMock,
} from './helpers/clipboard-mock.ts'

describe('copyToClipboard', () => {
	const mock = createClipboardMock()

	bench(
		'copyToClipboard - success path',
		async () => {
			await copyToClipboard('benchmark text')
		},
		{
			setup: () => {
				mock.install()
			},
			teardown: () => {
				mock.uninstall()
			},
		},
	)
})

describe('copyRichContent', () => {
	const mock = createRichClipboardMock()

	bench(
		'copyRichContent - success path',
		async () => {
			await copyRichContent('<b>bold</b>', 'bold')
		},
		{
			setup: () => {
				mock.install()
			},
			teardown: () => {
				mock.uninstall()
			},
		},
	)
})

describe('readFromClipboard', () => {
	const mock = createReadClipboardMock()

	bench(
		'readFromClipboard - success path',
		async () => {
			await readFromClipboard()
		},
		{
			setup: () => {
				mock.install()
			},
			teardown: () => {
				mock.uninstall()
			},
		},
	)
})
