import { describe, expect, it, vi } from 'vitest'
import images from './images'

const setup = ({ rows = [] as unknown[], total = rows.length, folder = null as { path: string } | null } = {}) => {
	const exif = { findMany: vi.fn().mockResolvedValue(rows), count: vi.fn().mockResolvedValue(total) }
	const folders = { findOne: vi.fn().mockResolvedValue(folder), findMany: vi.fn().mockResolvedValue([{ id: 1, name: 'Trips' }]) }
	const strapi: any = { db: { query: (uid: string) => (uid === 'plugin::upload.folder' ? folders : exif) } }
	const run = (handler: 'find' | 'folders', query: Record<string, unknown> = {}) => {
		const ctx = { query, body: undefined as any }

		return images({ strapi })[handler](ctx).then(() => ctx.body)
	}

	return { exif, folders, find: (query?: Record<string, unknown>) => run('find', query), listFolders: () => run('folders') }
}

describe('images.find', () => {
	it('returns the newest page with pagination', async () => {
		const { exif, find } = setup({ rows: [{ id: 1, cameraMake: 'FUJIFILM', file: { id: 7, name: 'a.jpg', url: '/a.jpg' } }], total: 45 })

		const body = await find({ page: '2', pageSize: '20' })

		expect(exif.findMany).toHaveBeenCalledWith({
			where: {},
			populate: { file: true },
			orderBy: { createdAt: 'desc' },
			limit: 20,
			offset: 20,
		})
		expect(body.pagination).toEqual({ page: 2, pageSize: 20, pageCount: 3, total: 45 })
		expect(body.results[0]).toMatchObject({ id: 1, cameraMake: 'FUJIFILM', file: { id: 7, name: 'a.jpg' } })
	})

	it('falls back to sane paging for bad input and caps the page size', async () => {
		const { exif, find } = setup()

		const body = await find({ page: '-3', pageSize: '100000' })

		expect(exif.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 100, offset: 0 }))
		expect(body.pagination).toMatchObject({ page: 1, pageSize: 100, pageCount: 1, total: 0 })
	})

	it('never exposes internal file columns', async () => {
		const { find } = setup({ rows: [{ id: 1, file: { id: 1, name: 'a.jpg', url: '/a.jpg', provider_metadata: { secret: 1 }, createdBy: { id: 9 } } }] })

		const body = await find()

		expect(Object.keys(body.results[0].file)).not.toContain('provider_metadata')
		expect(Object.keys(body.results[0].file)).not.toContain('createdBy')
	})

	it('searches name, camera make, model and lens, ignoring case, and counts with the same filter', async () => {
		const { exif, find } = setup()

		await find({ search: '  x-t20 ' })

		const where = { $and: [{ $or: [
			{ cameraMake: { $containsi: 'x-t20' } },
			{ cameraModel: { $containsi: 'x-t20' } },
			{ lensModel: { $containsi: 'x-t20' } },
			{ file: { name: { $containsi: 'x-t20' } } },
		] }] }

		expect(exif.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }))
		expect(exif.count).toHaveBeenCalledWith({ where })
	})

	it('ignores a blank search', async () => {
		const { exif, find } = setup()

		await find({ search: '   ' })

		expect(exif.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
	})

	it('filters by folder, including its subfolders but not a folder that only shares a prefix', async () => {
		const { exif, folders, find } = setup({ folder: { path: '/1' } })

		await find({ folder: '1' })

		expect(folders.findOne).toHaveBeenCalledWith({ where: { id: 1 }, select: ['path'] })
		expect(exif.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { $and: [{ $or: [{ file: { folderPath: '/1' } }, { file: { folderPath: { $startsWith: '/1/' } } }] }] },
			}),
		)
	})

	it('combines search and folder, and matches nothing for a folder that does not exist', async () => {
		const { exif, find } = setup({ folder: null })

		await find({ search: 'canon', folder: '99' })

		const { where } = exif.findMany.mock.calls[0][0]

		expect(where.$and).toHaveLength(2)
		expect(where.$and[1]).toEqual({ id: { $null: true } })
	})
})

describe('images.folders', () => {
	it('lists folders by name with the fields the filter needs', async () => {
		const { folders, listFolders } = setup()

		expect(await listFolders()).toEqual({ results: [{ id: 1, name: 'Trips' }] })
		expect(folders.findMany).toHaveBeenCalledWith({ select: ['id', 'pathId', 'name', 'path'], orderBy: { name: 'asc' } })
	})
})
