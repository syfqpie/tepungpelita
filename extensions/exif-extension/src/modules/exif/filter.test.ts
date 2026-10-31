import { describe, expect, it } from 'vitest'
import { buildFilter, hasFilters } from './filter'

describe('buildFilter', () => {
	it('is null when nothing is filtered, and ignores blank search', () => {
		expect(buildFilter('  ', null)).toBeNull()
	})

	it('searches camera, lens and file names with _icontains', () => {
		const filter = buildFilter(' canon ', null) as { _or: Record<string, unknown>[] }

		expect(filter._or).toHaveLength(5)
		expect(filter._or[0]).toEqual({ camera_make: { _icontains: 'canon' } })
		expect(filter._or[3]).toEqual({ file: { filename_download: { _icontains: 'canon' } } })
	})

	it('never uses dotted keys, which Directus rejects with a 403', () => {
		const keys = JSON.stringify(buildFilter('x', ['a'])).match(/"[^"]+":/g) ?? []

		expect(keys.filter((key) => key.includes('.'))).toEqual([])
	})

	it('filters by folder ids alone, and combines both with _and', () => {
		expect(buildFilter('', ['a', 'b'])).toEqual({ file: { folder: { _in: ['a', 'b'] } } })
		expect(buildFilter('x', ['a'])).toHaveProperty('_and.length', 2)
	})
})

describe('hasFilters', () => {
	it('is true for a non-blank search or a folder', () => {
		expect(hasFilters({ search: ' ', folder: null })).toBe(false)
		expect(hasFilters({ search: 'a', folder: null })).toBe(true)
		expect(hasFilters({ search: '', folder: 'f' })).toBe(true)
	})
})
