import { describe, expect, it } from 'vitest'
import { jsonFileName } from './download'

describe('jsonFileName', () => {
	it('drops the extension and unsafe characters', () => {
		expect(jsonFileName('DSCF8531.JPG')).toBe('DSCF8531-exif.json')
		expect(jsonFileName('my photo (1).jpg')).toBe('my_photo_1_-exif.json')
		expect(jsonFileName(undefined)).toBe('image-exif.json')
	})
})
