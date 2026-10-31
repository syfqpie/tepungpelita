import { describe, expect, it, vi } from 'vitest'
import { appUrl, fetchExifPage, fetchFolders, fetchRaw, PAGE_SIZE, thumbUrl } from './api'

const fakeApi = (response: unknown, baseURL = '/') => ({ get: vi.fn().mockResolvedValue({ data: response }), defaults: { baseURL } }) as never

const ok = (data: unknown[] = [], filter_count = data.length) => ({ data, meta: { filter_count } })

describe('fetchExifPage', () => {
	it('asks for one page, newest first, with the total', async () => {
		const api = fakeApi(ok())

		await fetchExifPage(api, 3, null)

		const [url, { params }] = (api as any).get.mock.calls[0]

		expect(url).toBe('/items/exif_metadata')
		expect(params).toMatchObject({ sort: '-date_created', limit: PAGE_SIZE, page: 3, meta: 'filter_count' })
		expect(params).not.toHaveProperty('filter')
	})

	it('does not download `raw` for the list; the drawer fetches it', async () => {
		const api = fakeApi(ok())

		await fetchExifPage(api, 1, null)

		const fields: string[] = (api as any).get.mock.calls[0][1].params.fields.split(',')

		expect(fields).not.toContain('raw')
		expect(fields).not.toContain('*')
		expect(fields).toEqual(expect.arrayContaining(['camera_model', 'file.id', 'file.filename_download', 'file.folder']))
	})

	it('sends the filter as a JSON string, as Directus expects', async () => {
		const api = fakeApi(ok())
		const filter = { file: { folder: { _in: ['a'] } } }

		await fetchExifPage(api, 1, filter)

		expect((api as any).get.mock.calls[0][1].params.filter).toBe(JSON.stringify(filter))
	})

	it('maps rows and reads the filtered total, not the page length', async () => {
		const { rows, total } = await fetchExifPage(fakeApi(ok([{ id: 'a', aperture: '1.80' }], 45)), 1, null)

		expect(rows[0]).toMatchObject({ id: 'a', aperture: 1.8 })
		expect(total).toBe(45)
	})
})

describe('fetchRaw', () => {
	it('reads only the raw column of one item, and is null when none is stored', async () => {
		const api = fakeApi({ data: { raw: { Make: 'Canon' } } })

		expect(await fetchRaw(api, 'abc')).toEqual({ Make: 'Canon' })
		expect((api as any).get.mock.calls[0]).toEqual(['/items/exif_metadata/abc', { params: { fields: 'raw' } }])
		expect(await fetchRaw(fakeApi({ data: { raw: null } }), 'abc')).toBeNull()
	})
})

describe('fetchFolders', () => {
	it('loads every folder', async () => {
		const api = fakeApi({ data: [{ id: 'f', name: 'Home', parent: null }] })

		expect(await fetchFolders(api)).toHaveLength(1)
		expect((api as any).get.mock.calls[0][1].params.limit).toBe(-1)
	})
})

describe('appUrl', () => {
	vi.stubGlobal('window', { location: { href: 'http://localhost:8055/admin/exif' } })

	it('resolves against the API root, which may be a subpath', () => {
		expect(appUrl(fakeApi({}, '/'), 'assets/1')).toBe('http://localhost:8055/assets/1')
		expect(appUrl(fakeApi({}, '/cms/'), 'assets/1')).toBe('http://localhost:8055/cms/assets/1')
	})

	it('builds the thumbnail URL from the file id, and is empty when the file is gone', () => {
		const row = { file: { id: 'f1' } } as never

		expect(thumbUrl(fakeApi({}), row)).toBe('http://localhost:8055/assets/f1?key=system-small-cover')
		expect(thumbUrl(fakeApi({}), { file: null } as never)).toBe('')
	})
})
