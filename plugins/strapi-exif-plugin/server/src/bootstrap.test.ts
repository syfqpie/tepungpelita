import { beforeEach, describe, expect, it, vi } from 'vitest'
import exifr from 'exifr'
import bootstrap from './bootstrap'

vi.mock('exifr', () => ({ default: { parse: vi.fn() } }))

const parse = vi.mocked(exifr.parse)
const image = { id: 7, mime: 'image/jpeg', provider: 'local', url: '/uploads/a.jpg' }

const setup = (existing: { id: number } | null = null) => {
	const query = {
		findOne: vi.fn().mockResolvedValue(existing),
		create: vi.fn(),
		update: vi.fn(),
		deleteMany: vi.fn(),
	}
	let handlers: Record<string, (event: any) => Promise<void>> = {}
	const strapi: any = {
		db: {
			query: () => query,
			lifecycles: { subscribe: (sub: typeof handlers) => (handlers = sub) },
		},
		dirs: { static: { public: '/app/public' } },
		log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
	}

	bootstrap({ strapi })

	return { query, handlers, strapi }
}

describe('exif lifecycle', () => {
	beforeEach(() => {
		parse.mockReset()
	})

	it('creates an entry for a new image with EXIF', async () => {
		parse.mockResolvedValue({ Make: 'Canon' })
		const { query, handlers } = setup()

		await handlers.afterCreate({ result: image })

		expect(parse).toHaveBeenCalledWith('/app/public/uploads/a.jpg', expect.anything())
		expect(query.create).toHaveBeenCalledWith({ data: expect.objectContaining({ file: 7, cameraMake: 'Canon' }) })
	})

	it('skips non-images and non-local providers', async () => {
		const { query, handlers } = setup()

		await handlers.afterCreate({ result: { ...image, mime: 'application/pdf' } })
		await handlers.afterCreate({ result: { ...image, provider: 'aws-s3' } })

		expect(parse).not.toHaveBeenCalled()
		expect(query.create).not.toHaveBeenCalled()
	})

	it('updates the existing entry when a file is replaced', async () => {
		parse.mockResolvedValue({ Make: 'Nikon' })
		const { query, handlers } = setup({ id: 3 })

		await handlers.afterUpdate({ params: { data: { size: 12 } }, result: image })

		expect(query.update).toHaveBeenCalledWith({ where: { id: 3 }, data: expect.objectContaining({ cameraMake: 'Nikon' }) })
		expect(query.create).not.toHaveBeenCalled()
	})

	it('removes the old entry when the replacement has no EXIF', async () => {
		parse.mockResolvedValue(undefined)
		const { query, handlers } = setup({ id: 3 })

		await handlers.afterUpdate({ params: { data: { size: 12 } }, result: image })

		expect(query.deleteMany).toHaveBeenCalledWith({ where: { file: 7 } })
		expect(query.create).not.toHaveBeenCalled()
	})

	it('ignores info edits that carry no new bytes', async () => {
		const { query, handlers } = setup()

		await handlers.afterUpdate({ params: { data: { alternativeText: 'x' } }, result: image })

		expect(parse).not.toHaveBeenCalled()
		expect(query.deleteMany).not.toHaveBeenCalled()
	})

	it('deletes the entry when its file is deleted', async () => {
		const { query, handlers } = setup()

		await handlers.beforeDelete({ params: { where: { id: 7 } } })

		expect(query.deleteMany).toHaveBeenCalledWith({ where: { file: 7 } })
	})

	it('does not throw when parsing fails', async () => {
		parse.mockRejectedValue(new Error('boom'))
		const { handlers, strapi } = setup()

		await handlers.afterCreate({ result: image })

		expect(strapi.log.error).toHaveBeenCalledWith(expect.stringContaining('boom'))
	})
})
