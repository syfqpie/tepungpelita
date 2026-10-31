import { describe, expect, it } from 'vitest'
import { cameraName, formatAperture, formatFocalLength, formatGps, formatShutter, formatSize, formatTaken } from './format'

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
})

describe('formatSize', () => {
	it('switches to MB from 1024 KB', () => {
		expect(formatSize(512.4)).toBe('512 KB')
		expect(formatSize(2048)).toBe('2 MB')
		expect(formatSize(null)).toBe('')
	})
})

describe('formatTaken', () => {
	it('shows the camera clock regardless of the browser timezone', () => {
		expect(formatTaken('2025-01-29T19:15:01.000Z', { locale: 'en-GB' })).toBe('29 Jan 2025, 19:15:01')
		expect(formatTaken('2025-01-29T19:15:01.000Z', { time: false, locale: 'en-GB' })).toBe('29 Jan 2025')
		expect(formatTaken(null)).toBe('')
	})
})

describe('cameraName', () => {
	it('does not repeat the make when the model already starts with it', () => {
		expect(cameraName('Canon', 'Canon EOS 5D')).toBe('Canon EOS 5D')
		expect(cameraName('FUJIFILM', 'X-T20')).toBe('FUJIFILM X-T20')
		expect(cameraName(null, 'X-T20')).toBe('X-T20')
		expect(cameraName('Canon', null)).toBe('Canon')
	})
})
