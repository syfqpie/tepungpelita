import type { Core } from '@strapi/strapi'

import { EXIF_UID, FOLDER_UID } from '../constants'
import { toImage } from '../helpers'

const PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100
const MAX_SEARCH_LENGTH = 100

const toPositiveInt = (value: unknown, fallback: number) => {
	const number = Math.floor(Number(value))

	return number > 0 ? number : fallback
}

/** Matches the text in the camera fields or in the file name, ignoring case. */
const searchFilter = (text: string) => ({
	$or: [
		{ cameraMake: { $containsi: text } },
		{ cameraModel: { $containsi: text } },
		{ lensModel: { $containsi: text } },
		{ file: { name: { $containsi: text } } },
	],
})

type Ctx = { query: Record<string, unknown>; body: unknown }

export default ({ strapi }: { strapi: Core.Strapi }) => ({
	/**
	 * One page of images that have EXIF data, newest first, with only the fields the admin page shows.
	 * `search` filters by name, camera make, model or lens; `folder` (a Media Library folder id) by folder.
	 */
	async find(ctx: Ctx) {
		const page = toPositiveInt(ctx.query.page, 1)
		const pageSize = Math.min(toPositiveInt(ctx.query.pageSize, PAGE_SIZE), MAX_PAGE_SIZE)
		const search = String(ctx.query.search ?? '').trim().slice(0, MAX_SEARCH_LENGTH)
		const folderId = toPositiveInt(ctx.query.folder, 0)
		const filters: object[] = []

		if (search) filters.push(searchFilter(search))

		if (folderId) {
			const folder = await strapi.db.query(FOLDER_UID).findOne({ where: { id: folderId }, select: ['path'] })

			// Same rule Strapi uses for a folder's contents: the folder itself or anything below it.
			filters.push(
				folder
					? { $or: [{ file: { folderPath: folder.path } }, { file: { folderPath: { $startsWith: `${folder.path}/` } } }] }
					: { id: { $null: true } },
			)
		}

		const where = filters.length > 0 ? { $and: filters } : {}
		const query = strapi.db.query(EXIF_UID)

		const [rows, total] = await Promise.all([
			query.findMany({
				where,
				populate: { file: true },
				orderBy: { createdAt: 'desc' },
				limit: pageSize,
				offset: (page - 1) * pageSize,
			}),
			query.count({ where }),
		])

		ctx.body = {
			results: rows.map(toImage),
			pagination: { page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), total },
		}
	},

	/** Media Library folders, for the folder filter. `pathId` is what a folder's `path` is made of. */
	async folders(ctx: Ctx) {
		ctx.body = {
			results: await strapi.db.query(FOLDER_UID).findMany({
				select: ['id', 'pathId', 'name', 'path'],
				orderBy: { name: 'asc' },
			}),
		}
	},
})
