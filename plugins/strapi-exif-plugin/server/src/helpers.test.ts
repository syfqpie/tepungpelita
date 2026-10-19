import { describe, expect, it } from 'vitest'
import { toExifRecord } from './helpers'

describe('toExifRecord', () => {
	it('maps EXIF tags to exif-metadata fields', () => {
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

		expect(toExifRecord(7, exif)).toMatchObject({
			file: 7,
			cameraMake: 'Canon',
			cameraModel: 'Canon EOS R6m2',
			lensModel: 'RF24-105mm F4 L IS USM',
			dateTaken: taken,
			iso: 100,
			aperture: 4,
			gpsLatitude: 3.1,
			gpsLongitude: 101.6,
			raw: exif,
		})
	})

	it('falls back to CreateDate when DateTimeOriginal is missing', () => {
		const created = new Date('2020-01-01T00:00:00.000Z')

		expect(toExifRecord(1, { CreateDate: created }).dateTaken).toBe(created)
	})

	it('sets missing tags to null', () => {
		const record = toExifRecord(1, {})

		expect(record.cameraMake).toBeNull()
		expect(record.dateTaken).toBeNull()
		expect(record.gpsAltitude).toBeNull()
	})
})
