import { describe, expect, it } from 'vitest'
import { fileMeta, toExifRow } from './adapter'

describe('toExifRow', () => {
	it('coerces decimals that arrive as strings', () => {
		const row = toExifRow({ id: 'a', aperture: '1.80', exposure_time: '0.00012500', gps_latitude: '3.1', iso: 100 })

		expect(row.aperture).toBe(1.8)
		expect(row.exposureTime).toBe(0.000125)
		expect(row.gpsLatitude).toBe(3.1)
		expect(row.iso).toBe(100)
	})

	it('keeps missing and invalid numbers as null, not 0', () => {
		const row = toExifRow({ id: 'a', aperture: null, focal_length: '', gps_altitude: 'abc' })

		expect(row.aperture).toBeNull()
		expect(row.focalLength).toBeNull()
		expect(row.gpsAltitude).toBeNull()
		expect(row.iso).toBeNull()
	})

	it('maps the related file, and is null when the file is only an id', () => {
		const file = { id: 'f1', filename_download: 'a.jpg', filesize: '2048', folder: 'd1' }

		expect(toExifRow({ id: 'a', file })).toMatchObject({ file: { id: 'f1', name: 'a.jpg', size: 2048, folder: 'd1' } })
		expect(toExifRow({ id: 'a', file: 'f1' }).file).toBeNull()
	})
})

describe('fileMeta', () => {
	const file = { id: 'f', name: 'a.jpg', title: null, type: 'image/jpeg', size: 8_589_934, width: 4000, height: 6000, folder: null }

	it('turns Directus bytes into a readable size (not KB)', () => {
		expect(fileMeta(file)).toBe('4000 × 6000 · 8.2 MB')
		expect(fileMeta({ ...file, size: 302 * 1024 })).toBe('4000 × 6000 · 302 KB')
	})

	it('adds the type only when asked, and survives missing parts', () => {
		expect(fileMeta(file, { type: true })).toBe('4000 × 6000 · 8.2 MB · image/jpeg')
		expect(fileMeta({ ...file, width: null, size: null, type: null }, { type: true })).toBe('')
		expect(fileMeta(null)).toBe('')
	})
})
