import { describe, expect, it, vi } from 'vitest'
import images from './images'

const setup = (rows: unknown[] = [], total = rows.length) => {
	const query = { findMany: vi.fn().mockResolvedValue(rows), count: vi.fn().mockResolvedValue(total) }
	const strapi: any = { db: { query: () => query } }

	return { query, find: (q: Record<string, unknown> = {}) => {
		const ctx = { query: q, body: undefined as any }

		return images({ strapi }).find(ctx).then(() => ctx.body)
	} }
}

describe('images.find', () => {
	it('returns the newest page with pagination', async () => {
		const { query, find } = setup([{ id: 1, cameraMake: 'FUJIFILM', file: { name: 'a.jpg', url: '/a.jpg' } }], 45)

		const body = await find({ page: '2', pageSize: '20' })

		expect(query.findMany).toHaveBeenCalledWith({
			populate: { file: true },
			orderBy: { createdAt: 'desc' },
			limit: 20,
			offset: 20,
		})
		expect(body.pagination).toEqual({ page: 2, pageSize: 20, pageCount: 3, total: 45 })
		expect(body.results[0]).toMatchObject({ id: 1, cameraMake: 'FUJIFILM', file: { name: 'a.jpg' } })
	})

	it('falls back to sane paging for bad input and caps the page size', async () => {
		const { query, find } = setup()

		const body = await find({ page: '-3', pageSize: '100000' })

		expect(query.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 100, offset: 0 }))
		expect(body.pagination).toMatchObject({ page: 1, pageSize: 100, pageCount: 1, total: 0 })
	})

	it('never exposes internal file columns', async () => {
		const { find } = setup([{ id: 1, file: { name: 'a.jpg', url: '/a.jpg', provider_metadata: { secret: 1 }, createdBy: { id: 9 } } }])

		const body = await find()

		expect(Object.keys(body.results[0].file)).not.toContain('provider_metadata')
		expect(Object.keys(body.results[0].file)).not.toContain('createdBy')
	})
})
