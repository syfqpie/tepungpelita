import type { useApi } from '@directus/extensions-sdk'
import { type ExifItem, toExifRow } from './adapter'
import type { Folder } from './folders'
import type { ExifRow } from './types'

export const PAGE_SIZE = 20

const FIELDS = [
	'*',
	'file.id',
	'file.filename_download',
	'file.title',
	'file.type',
	'file.filesize',
	'file.width',
	'file.height',
	'file.folder',
].join(',')

export const fetchExifPage = async (api: ReturnType<typeof useApi>, page: number, filter: object | null) => {
	const { data } = await api.get('/items/exif_metadata', {
		params: { fields: FIELDS, sort: '-date_created', limit: PAGE_SIZE, page, meta: 'filter_count', ...(filter ? { filter: JSON.stringify(filter) } : {}) },
	})

	return { rows: (data.data as ExifItem[]).map(toExifRow), total: Number(data.meta?.filter_count ?? 0) }
}

export const fetchFolders = async (api: ReturnType<typeof useApi>): Promise<Folder[]> => {
	const { data } = await api.get('/folders', { params: { fields: 'id,name,parent', limit: -1 } })

	return data.data
}

/** Assets and file pages live next to the API, which may not be at the site root. */
export const appUrl = (api: ReturnType<typeof useApi>, path: string): string =>
	new URL(path, new URL(api.defaults.baseURL || '/', window.location.href)).href

export const thumbUrl = (api: ReturnType<typeof useApi>, row: ExifRow): string =>
	row.file ? appUrl(api, `assets/${row.file.id}?key=system-small-cover`) : ''
