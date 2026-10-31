import { describe, expect, it } from 'vitest'
import {
	assetUrl,
	formatAperture,
	formatFocalLength,
	formatGps,
	formatShutter,
	formatSize,
	formatTaken,
	formatTagValue,
	previewUrl,
	tagEntries,
	thumbUrl,
} from './utils'

describe('formatShutter', () => {
	it('shows fast shutters as a fraction', () => {
		expect(formatShutter(0.0125)).toBe('1/80 s')
		expect(formatShutter(0.000125)).toBe('1/8000 s')
	})

	it('shows slow shutters in seconds', () => {
		expect(formatShutter(2)).toBe('2 s')
		expect(formatShutter(1.3)).toBe('1.3 s')
	})

	it('is empty when missing or invalid', () => {
		expect(formatShutter(null)).toBe('')
		expect(formatShutter(0)).toBe('')
	})
})

describe('other formatters', () => {
	it('formats aperture and focal length', () => {
		expect(formatAperture(11)).toBe('f/11')
		expect(formatAperture(1.8)).toBe('f/1.8')
		expect(formatFocalLength(63)).toBe('63 mm')
		expect(formatFocalLength(undefined)).toBe('')
	})

	it('needs both coordinates for GPS', () => {
		expect(formatGps(3.1, 101.6)).toBe('3.10000, 101.60000')
		expect(formatGps(3.1, null)).toBe('')
	})

	it('prefixes only relative asset URLs with the backend', () => {
		expect(assetUrl('/uploads/a.jpg', 'http://localhost:1337')).toBe('http://localhost:1337/uploads/a.jpg')
		expect(assetUrl('https://cdn.example.com/a.jpg', 'http://localhost:1337')).toBe('https://cdn.example.com/a.jpg')
	})
})

describe('formatSize', () => {
	it('switches to MB from 1024 KB', () => {
		expect(formatSize(512.4)).toBe('512 KB')
		expect(formatSize(2048)).toBe('2 MB')
		expect(formatSize(null)).toBe('')
	})
})

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

describe('image urls', () => {
	const file = { name: 'a', url: '/a.jpg', formats: { small: { url: '/s.jpg' }, thumbnail: { url: '/t.jpg' } } }

	it('prefers the thumbnail for lists and the largest format for the preview', () => {
		expect(thumbUrl(file)).toBe('/t.jpg')
		expect(previewUrl(file)).toBe('/s.jpg')
		expect(previewUrl({ name: 'a', url: '/a.jpg' })).toBe('/a.jpg')
	})
})

describe('formatTaken', () => {
	it('shows the camera clock regardless of the browser timezone', () => {
		expect(formatTaken('2025-01-29T19:15:01.000Z', { locale: 'en-GB' })).toBe('29 Jan 2025, 19:15:01')
		expect(formatTaken('2025-01-29T19:15:01.000Z', { time: false, locale: 'en-GB' })).toBe('29 Jan 2025')
		expect(formatTaken(null)).toBe('')
	})
})
