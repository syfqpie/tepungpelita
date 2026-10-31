import { describe, expect, it, vi } from 'vitest'
import { ensureCollectionExists } from './index'

const setup = (schema: { collections: Record<string, unknown>; relations: { collection: string; field: string }[] }) => {
	const createCollection = vi.fn()
	const createRelation = vi.fn()
	const context: any = {
		getSchema: async () => schema,
		logger: { info: vi.fn(), error: vi.fn() },
		services: {
			CollectionsService: class {
				createOne = createCollection
			},
			RelationsService: class {
				createOne = createRelation
			},
		},
	}

	return { context, createCollection, createRelation }
}

describe('ensureCollectionExists', () => {
	it('creates the collection and the relation on a fresh install', async () => {
		const { context, createCollection, createRelation } = setup({ collections: {}, relations: [] })

		await ensureCollectionExists(context)

		expect(createCollection).toHaveBeenCalledOnce()
		expect(createRelation).toHaveBeenCalledOnce()
	})

	it('repairs a missing relation when the collection already exists', async () => {
		const { context, createCollection, createRelation } = setup({ collections: { exif_metadata: {} }, relations: [] })

		await ensureCollectionExists(context)

		expect(createCollection).not.toHaveBeenCalled()
		expect(createRelation).toHaveBeenCalledOnce()
	})

	it('does nothing when both exist', async () => {
		const { context, createCollection, createRelation } = setup({
			collections: { exif_metadata: {} },
			relations: [{ collection: 'exif_metadata', field: 'file' }],
		})

		await ensureCollectionExists(context)

		expect(createCollection).not.toHaveBeenCalled()
		expect(createRelation).not.toHaveBeenCalled()
	})
})
