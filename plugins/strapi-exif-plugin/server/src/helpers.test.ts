import exifr from 'exifr'
import { describe, expect, it } from 'vitest'
import { EXIF_OPTIONS, toExifRecord } from './helpers'

describe('toExifRecord', () => {
	it('maps EXIF tags to exif-metadata fields', () => {
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

		expect(toExifRecord(7, exif)).toMatchObject({
			file: 7,
			cameraMake: 'Canon',
			cameraModel: 'Canon EOS R6m2',
			lensModel: 'RF24-105mm F4 L IS USM',
			dateTaken: stored,
			iso: 100,
			aperture: 4,
			gpsLatitude: 3.1,
			gpsLongitude: 101.6,
			raw: { ...exif, DateTimeOriginal: stored },
		})
	})

	it('falls back to CreateDate when DateTimeOriginal is missing', () => {
		const created = new Date(2020, 0, 1, 0, 0, 0)

		expect(toExifRecord(1, { CreateDate: created }).dateTaken).toEqual(new Date('2020-01-01T00:00:00.000Z'))
	})

	it('stores the camera wall-clock time whatever the server timezone', () => {
		const original = process.env.TZ

		try {
			for (const zone of ['UTC', 'Asia/Kuala_Lumpur', 'America/New_York']) {
				process.env.TZ = zone

				const record = toExifRecord(1, { DateTimeOriginal: new Date(2022, 11, 15, 14, 15, 15) })

				expect(record.dateTaken).toEqual(new Date('2022-12-15T14:15:15.000Z'))
			}
		} finally {
			if (original === undefined) delete process.env.TZ
			else process.env.TZ = original
		}
	})

	it('sets missing tags to null', () => {
		const record = toExifRecord(1, {})

		expect(record.cameraMake).toBeNull()
		expect(record.dateTaken).toBeNull()
		expect(record.gpsAltitude).toBeNull()
	})
})

describe('EXIF_OPTIONS', () => {
	// Minimal JPEG whose only EXIF tag is Orientation = 6.
	const jpeg = Buffer.from('ffd8ffe10022457869660000494 92a000800000001001201030001000000060000000000000000ffd9'.replace(/ /g, ''), 'hex')

	it('keeps Orientation numeric so it fits the integer column', async () => {
		const exif = await exifr.parse(jpeg, EXIF_OPTIONS)

		expect(exif.Orientation).toBe(6)
		expect(toExifRecord(1, exif).orientation).toBe(6)
	})
})
