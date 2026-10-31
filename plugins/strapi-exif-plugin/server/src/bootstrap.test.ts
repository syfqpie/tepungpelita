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
	const originalOptimize = vi.fn(async (file: unknown) => file)
	const imageManipulation = { optimize: originalOptimize }
	const strapi: any = {
		plugin: () => ({ service: () => imageManipulation }),
		db: {
			query: () => query,
			lifecycles: { subscribe: (sub: typeof handlers) => (handlers = sub) },
		},
		dirs: { static: { public: '/app/public' } },
		log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
	}

	bootstrap({ strapi })

	return { query, handlers, strapi, imageManipulation, originalOptimize }
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

	it('uses the EXIF read before optimization instead of re-reading the stored file', async () => {
		parse.mockResolvedValue({ Make: 'Canon' })
		const { query, handlers, imageManipulation, originalOptimize } = setup()
		const upload: { filepath: string; mime: string; _exif?: unknown } = { filepath: '/tmp/original.jpg', mime: 'image/jpeg' }

		await imageManipulation.optimize(upload)
		// the re-encoded file no longer has EXIF, so a second parse would find none
		parse.mockResolvedValue(undefined)
		await handlers.afterCreate({ params: { data: upload }, result: image })

		expect(parse).toHaveBeenCalledOnce()
		expect(parse).toHaveBeenCalledWith('/tmp/original.jpg', expect.anything())
		expect(originalOptimize).toHaveBeenCalledWith(upload)
		expect(query.create).toHaveBeenCalledWith({ data: expect.objectContaining({ cameraMake: 'Canon' }) })
	})

	it('treats an original without EXIF as final, even if the stored file is read later', async () => {
		parse.mockResolvedValue(undefined)
		const { query, handlers, imageManipulation } = setup({ id: 3 })
		const upload = { filepath: '/tmp/original.jpg', mime: 'image/jpeg' }

		await imageManipulation.optimize(upload)
		await handlers.afterUpdate({ params: { data: { size: 1, ...upload } }, result: image })

		expect(parse).toHaveBeenCalledOnce()
		expect(query.deleteMany).toHaveBeenCalledWith({ where: { file: 7 } })
	})

	it('still optimizes when the original cannot be parsed', async () => {
		parse.mockRejectedValue(new Error('corrupt'))
		const { imageManipulation, originalOptimize, strapi } = setup()
		const upload: { filepath: string; mime: string; _exif?: unknown } = { filepath: '/tmp/original.jpg', mime: 'image/jpeg' }

		await imageManipulation.optimize(upload)

		expect(originalOptimize).toHaveBeenCalledWith(upload)
		expect(upload._exif).toBeUndefined()
		expect(strapi.log.warn).toHaveBeenCalled()
	})

	it('skips formats exifr cannot read, before and after optimization', async () => {
		const { query, handlers, imageManipulation, strapi } = setup()

		await imageManipulation.optimize({ filepath: '/tmp/a.webp', mime: 'image/webp' } as never)
		await handlers.afterCreate({ result: { ...image, mime: 'image/webp' } })

		expect(parse).not.toHaveBeenCalled()
		expect(query.create).not.toHaveBeenCalled()
		expect(strapi.log.warn).not.toHaveBeenCalled()
		expect(strapi.log.error).not.toHaveBeenCalled()
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
