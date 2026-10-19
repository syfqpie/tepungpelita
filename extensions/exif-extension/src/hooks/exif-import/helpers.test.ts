import { describe, expect, it } from 'vitest'
import { getLocalStorageRoot, toExifRecord } from './helpers'

describe('toExifRecord', () => {
	it('maps EXIF tags to exif_metadata fields', () => {
		const taken = new Date('2022-12-15T06:15:15.000Z')
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
			date_taken: taken,
			iso: 100,
			aperture: 4,
			gps_latitude: 3.1,
			gps_longitude: 101.6,
			raw: exif,
		})
	})

	it('falls back to CreateDate when DateTimeOriginal is missing', () => {
		const created = new Date('2020-01-01T00:00:00.000Z')

		expect(toExifRecord('id', { CreateDate: created }).date_taken).toBe(created)
	})

	it('sets missing tags to null', () => {
		const record = toExifRecord('id', {})

		expect(record.camera_make).toBeNull()
		expect(record.date_taken).toBeNull()
		expect(record.gps_altitude).toBeNull()
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
