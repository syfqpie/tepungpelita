import { describe, expect, it } from 'vitest'
import { folderOptions, withDescendants } from './folders'

const folders = [
	{ id: 'trips', name: 'Trips', parent: null },
	{ id: '2025', name: '2025', parent: 'trips' },
	{ id: 'kl', name: 'KL', parent: '2025' },
	{ id: 'family', name: 'Family', parent: null },
]

describe('folderOptions', () => {
	it('labels folders with their ancestry, sorted', () => {
		expect(folderOptions(folders).map((option) => option.text)).toEqual(['Family', 'Trips', 'Trips / 2025', 'Trips / 2025 / KL'])
	})

	it('survives a parent cycle', () => {
		const loop = [
			{ id: 'a', name: 'A', parent: 'b' },
			{ id: 'b', name: 'B', parent: 'a' },
		]

		expect(folderOptions(loop)).toHaveLength(2)
	})
})

describe('withDescendants', () => {
	it('includes nested folders but not siblings', () => {
		expect(withDescendants(folders, 'trips').sort()).toEqual(['2025', 'kl', 'trips'])
		expect(withDescendants(folders, 'kl')).toEqual(['kl'])
	})
})
