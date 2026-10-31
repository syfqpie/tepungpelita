import type { ApiExtensionContext } from '@directus/types'
import { COLLECTION, collectionMeta, relationDefinition } from '../schemas/exif-metadata'

/**
 * Creates the `exif_metadata` collection and its relation to `directus_files`,
 * whichever is missing. Safe to call on every boot; errors are logged, not thrown.
 */
export const ensureCollectionExists = async (context: ApiExtensionContext): Promise<void> => {
	const { services, getSchema, logger } = context

	try {
		let schema = await getSchema()

		if (!schema.collections[COLLECTION]) {
			await new services.CollectionsService({ schema }).createOne(collectionMeta)
			schema = await getSchema() // relation needs a schema that includes the collection we just made
			logger.info(`[exif-extension] created "${COLLECTION}" collection`)
		}

		// checked on its own so a boot that died between the two steps is repaired on the next one
		const hasRelation = schema.relations.some((r) => r.collection === COLLECTION && r.field === relationDefinition.field)

		if (!hasRelation) {
			await new services.RelationsService({ schema }).createOne(relationDefinition)
			logger.info(`[exif-extension] created "${COLLECTION}" relation`)
		}
	} catch (err: any) {
		// guards against race conditions when multiple API instances boot at once
		if (err?.message?.includes('already exists')) {
			logger.info(`[exif-extension] "${COLLECTION}" already exists, skipping`)
			return
		}
		logger.error(err, `[exif-extension] failed to provision "${COLLECTION}"`)
	}
}
