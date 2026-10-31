import type { Core } from '@strapi/strapi'

import { EXIF_UID } from '../constants'
import { toImage } from '../helpers'

const PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const toPositiveInt = (value: unknown, fallback: number) => {
	const number = Math.floor(Number(value))

	return number > 0 ? number : fallback
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
	/** One page of images that have EXIF data, newest first, with only the fields the admin page shows. */
	async find(ctx: { query: Record<string, unknown>; body: unknown }) {
		const page = toPositiveInt(ctx.query.page, 1)
		const pageSize = Math.min(toPositiveInt(ctx.query.pageSize, PAGE_SIZE), MAX_PAGE_SIZE)
		const query = strapi.db.query(EXIF_UID)

		const [rows, total] = await Promise.all([
			query.findMany({
				populate: { file: true },
				orderBy: { createdAt: 'desc' },
				limit: pageSize,
				offset: (page - 1) * pageSize,
			}),
			query.count(),
		])

		ctx.body = {
			results: rows.map(toImage),
			pagination: { page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)), total },
		}
	},
})
