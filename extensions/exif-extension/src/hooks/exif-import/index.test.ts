import { beforeEach, describe, expect, it, vi } from 'vitest'
import exifr from 'exifr'
import hook from './index'

vi.mock('exifr', () => ({ default: { parse: vi.fn() } }))

const parse = vi.mocked(exifr.parse)

const setup = (file: Record<string, unknown>, existing: { id: string }[] = []) => {
	const items = { readByQuery: vi.fn().mockResolvedValue(existing), createOne: vi.fn(), updateOne: vi.fn() }
	const context: any = {
		getSchema: async () => ({}),
		logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
		env: { STORAGE_LOCAL_DRIVER: 'local', STORAGE_LOCAL_ROOT: '/data/uploads' },
		services: {
			FilesService: class {
				readOne = async () => file
			},
			ItemsService: class {
				constructor() {
					return items
				}
			},
		},
	}
	let upload: (meta: { key: string; collection: string }) => Promise<void> = async () => {}

	;(hook as any)({ action: (_: string, fn: typeof upload) => (upload = fn), init: vi.fn() }, context)

	return { items, context, upload: (key = 'f1') => upload({ key, collection: 'directus_files' }) }
}

const image = { id: 'f1', type: 'image/jpeg', filename_disk: 'a.jpg', storage: 'local' }

describe('files.upload hook', () => {
	beforeEach(() => {
		parse.mockReset()
	})

	it('creates a row for an image with EXIF', async () => {
		parse.mockResolvedValue({ Make: 'Canon' })
		const { items, upload } = setup(image)

		await upload()

		expect(parse).toHaveBeenCalledWith('/data/uploads/a.jpg', expect.anything())
		expect(items.createOne).toHaveBeenCalledWith(expect.objectContaining({ file: 'f1', camera_make: 'Canon' }))
	})

	it('updates the existing row when the file is replaced', async () => {
		parse.mockResolvedValue({ Make: 'Nikon' })
		const { items, upload } = setup(image, [{ id: 'r1' }])

		await upload()

		expect(items.updateOne).toHaveBeenCalledWith('r1', expect.objectContaining({ camera_make: 'Nikon' }))
		expect(items.createOne).not.toHaveBeenCalled()
	})

	it('skips non-images and non-local storage', async () => {
		await setup({ ...image, type: 'application/pdf' }).upload()
		await setup({ ...image, storage: 's3' }).upload()

		expect(parse).not.toHaveBeenCalled()
	})

	it('writes nothing when there is no EXIF', async () => {
		parse.mockResolvedValue(undefined)
		const { items, upload } = setup(image)

		await upload()

		expect(items.createOne).not.toHaveBeenCalled()
	})
})
