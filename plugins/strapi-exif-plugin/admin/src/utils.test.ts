import { describe, expect, it } from 'vitest'
import { assetUrl, folderOptions, previewUrl, thumbUrl, toCsv } from './utils'

describe('asset urls', () => {
	it('prefixes only relative asset URLs with the backend', () => {
		expect(assetUrl('/uploads/a.jpg', 'http://localhost:1337')).toBe('http://localhost:1337/uploads/a.jpg')
		expect(assetUrl('https://cdn.example.com/a.jpg', 'http://localhost:1337')).toBe('https://cdn.example.com/a.jpg')
	})
})

describe('image urls', () => {
	const file = { id: 1, name: 'a', url: '/a.jpg', formats: { small: { url: '/s.jpg' }, thumbnail: { url: '/t.jpg' } } }

	it('prefers the thumbnail for lists and the largest format for the preview', () => {
		expect(thumbUrl(file)).toBe('/t.jpg')
		expect(previewUrl(file)).toBe('/s.jpg')
		expect(previewUrl({ id: 1, name: 'a', url: '/a.jpg' })).toBe('/a.jpg')
	})
})

describe('toCsv', () => {
	const row = {
		id: 1,
		cameraMake: 'FUJIFILM',
		cameraModel: 'X-T20',
		lensModel: 'XC15-45mm, F3.5',
		dateTaken: '2025-01-29T19:15:05.000Z',
		iso: 2000,
		focalLength: 24.2,
		aperture: 4.4,
		exposureTime: 0.002,
		gpsLatitude: 3.1,
		gpsLongitude: -101.6,
		gpsAltitude: null,
		file: { id: 12, name: 'DSCF8531.JPG', url: '/uploads/a.jpg' },
	}

	it('writes a header and one line per image, with the camera clock time and absolute URLs', () => {
		const [header, line] = toCsv([row], 'http://localhost:1337').split('\r\n')

		expect(header.startsWith('File,File ID,Image URL,Camera make')).toBe(true)
		expect(line).toBe(
			'DSCF8531.JPG,12,http://localhost:1337/uploads/a.jpg,FUJIFILM,X-T20,"XC15-45mm, F3.5",2025-01-29 19:15:05,2000,4.4,0.002,24.2,3.1,-101.6,',
		)
	})

	it('quotes commas and quotes, and keeps negative numbers as numbers', () => {
		const line = toCsv([{ ...row, lensModel: 'say "hi"' }], '').split('\r\n')[1]

		expect(line).toContain('"say ""hi"""')
		expect(line).toContain(',-101.6,')
	})

	it('neutralises text that a spreadsheet would run as a formula', () => {
		const line = toCsv([{ ...row, file: { id: 1, name: '=HYPERLINK("x")', url: '/a' }, cameraMake: '@cmd' }], '').split('\r\n')[1]

		expect(line.startsWith('"\'=HYPERLINK(""x"")"')).toBe(true)
		expect(line).toContain(",'@cmd,")
	})

	it('leaves a file without a record empty', () => {
		expect(toCsv([{ ...row, file: null }], '').split('\r\n')[1].startsWith(',,,FUJIFILM')).toBe(true)
	})
})

describe('folderOptions', () => {
	it('labels nested folders with their parents and sorts by label', () => {
		expect(
			folderOptions([
				{ id: 5, pathId: 7, name: '2025', path: '/3/7' },
				{ id: 2, pathId: 9, name: 'Family', path: '/9' },
				{ id: 1, pathId: 3, name: 'Trips', path: '/3' },
			]),
		).toEqual([
			{ value: '2', label: 'Family' },
			{ value: '1', label: 'Trips' },
			{ value: '5', label: 'Trips / 2025' },
		])
	})

	it('falls back to the folder name when the path is empty', () => {
		expect(folderOptions([{ id: 1, pathId: 1, name: 'Solo', path: '' }])).toEqual([{ value: '1', label: 'Solo' }])
	})
})
