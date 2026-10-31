import exifr from 'exifr'
import { describe, expect, it } from 'vitest'
import { canReadExif, EXIF_OPTIONS, getLocalStorageRoot, toExifRecord } from './helpers'

describe('toExifRecord', () => {
	it('maps EXIF tags to exif_metadata fields', () => {
		const taken = new Date(2022, 11, 15, 14, 15, 15) // as exifr builds it: local time
		const stored = new Date('2022-12-15T14:15:15.000Z')
		const exif = {
			Make: 'Canon',
			Model: 'Canon EOS R6m2',
			LensModel: 'RF24-105mm F4 L IS USM',
			DateTimeOriginal: taken,
			ISO: 100,
			FNumber: 4,
			latitude: 3.1,
			longitude: 101.6,
		}

		expect(toExifRecord('file-id', exif)).toMatchObject({
			file: 'file-id',
			camera_make: 'Canon',
			camera_model: 'Canon EOS R6m2',
			lens_model: 'RF24-105mm F4 L IS USM',
			date_taken: stored,
			iso: 100,
			aperture: 4,
			gps_latitude: 3.1,
			gps_longitude: 101.6,
			raw: { ...exif, DateTimeOriginal: stored },
		})
	})

	it('falls back to CreateDate when DateTimeOriginal is missing', () => {
		const created = new Date(2020, 0, 1, 0, 0, 0)

		expect(toExifRecord('id', { CreateDate: created }).date_taken).toEqual(new Date('2020-01-01T00:00:00.000Z'))
	})

	it('stores the camera wall-clock time whatever the server timezone', () => {
		const original = process.env.TZ

		try {
			for (const zone of ['UTC', 'Asia/Kuala_Lumpur', 'America/New_York']) {
				process.env.TZ = zone

				const record = toExifRecord('id', { DateTimeOriginal: new Date(2022, 11, 15, 14, 15, 15) })

				expect(record.date_taken).toEqual(new Date('2022-12-15T14:15:15.000Z'))
			}
		} finally {
			if (original === undefined) delete process.env.TZ
			else process.env.TZ = original
		}
	})

	it('sets missing tags to null', () => {
		const record = toExifRecord('id', {})

		expect(record.camera_make).toBeNull()
		expect(record.date_taken).toBeNull()
		expect(record.gps_altitude).toBeNull()
	})
})

describe('canReadExif', () => {
	it('accepts the formats exifr can parse', () => {
		expect(canReadExif('image/jpeg')).toBe(true)
		expect(canReadExif('image/heic')).toBe(true)
	})

	it('rejects other formats, and files with no stored type (Directus uses null)', () => {
		expect(canReadExif('image/webp')).toBe(false)
		expect(canReadExif(null)).toBe(false)
		expect(canReadExif(undefined)).toBe(false)
	})
})

describe('getLocalStorageRoot', () => {
	it('returns the configured root for a local driver', () => {
		const env = { STORAGE_LOCAL_DRIVER: 'local', STORAGE_LOCAL_ROOT: '/data/uploads' }

		expect(getLocalStorageRoot(env, 'local')).toBe('/data/uploads')
	})

	it('defaults the root to ./uploads', () => {
		expect(getLocalStorageRoot({ STORAGE_LOCAL_DRIVER: 'local' }, 'local')).toBe('./uploads')
	})

	it('resolves the location name case-insensitively', () => {
		const env = { STORAGE_MEDIA_DRIVER: 'local', STORAGE_MEDIA_ROOT: '/media' }

		expect(getLocalStorageRoot(env, 'media')).toBe('/media')
	})

	it('returns null for non-local drivers', () => {
		expect(getLocalStorageRoot({ STORAGE_S3_DRIVER: 's3' }, 's3')).toBeNull()
	})
})

describe('EXIF_OPTIONS', () => {
	// Minimal JPEG whose only EXIF tag is Orientation = 6.
	const jpeg = Buffer.from('ffd8ffe10022457869660000494 92a000800000001001201030001000000060000000000000000ffd9'.replace(/ /g, ''), 'hex')

	it('keeps Orientation numeric so it fits the integer column', async () => {
		const exif = await exifr.parse(jpeg, EXIF_OPTIONS)

		expect(exif.Orientation).toBe(6)
		expect(toExifRecord('id', exif).orientation).toBe(6)
	})
})
