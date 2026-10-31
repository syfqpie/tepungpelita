import { describe, expect, it } from 'vitest'
import { formatTagValue, tagEntries } from './tags'

describe('formatTagValue', () => {
	it('strips control characters and trims', () => {
		expect(formatTagValue('\u0000')).toBe('')
		expect(formatTagValue('FUJIFILM\u0000 ')).toBe('FUJIFILM')
	})

	it('joins lists and prints numbers', () => {
		expect(formatTagValue([15, 45, 3.5, 5.6])).toBe('15, 45, 3.5, 5.6')
		expect(formatTagValue(0)).toBe('0')
	})

	it('shows binary tags as bytes and shortens long ones', () => {
		expect(formatTagValue({ 0: 48, 1: 49, 2: 48, 3: 48 })).toBe('48 49 48 48')
		const long = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(i), i]))

		expect(formatTagValue(long)).toBe('0 1 2 3 4 5 6 7 … (20 bytes)')
	})

	it('falls back to JSON for other objects', () => {
		expect(formatTagValue({ a: 1 })).toBe('{"a":1}')
	})
})

describe('tagEntries', () => {
	it('sorts by name and keeps empty values', () => {
		expect(tagEntries({ Model: 'X-T20', Copyright: '\u0000', Make: 'FUJIFILM' })).toEqual([
			['Copyright', ''],
			['Make', 'FUJIFILM'],
			['Model', 'X-T20'],
		])
		expect(tagEntries(null)).toEqual([])
	})
})
