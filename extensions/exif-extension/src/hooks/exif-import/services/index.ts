import type { ApiExtensionContext } from '@directus/types'
import { COLLECTION, collectionMeta, relationDefinition } from '../schemas/exif-metadata'

/**
 * Creates the `exif_metadata` collection and its relation to `directus_files`
 * if they don't exist yet. Safe to call on every boot; errors are logged, not thrown.
 */
export const ensureCollectionExists = async (context: ApiExtensionContext): Promise<void> => {
	const { services, getSchema, logger } = context

	try {
		const schema = await getSchema()
		if (schema.collections[COLLECTION]) return // already provisioned

		const collectionsService = new services.CollectionsService({ schema })
		await collectionsService.createOne(collectionMeta)

		// relation needs a fresh schema that includes the collection we just made
		const relationsService = new services.RelationsService({ schema: await getSchema() })
		await relationsService.createOne(relationDefinition)

		logger.info(`[exif-extension] created "${COLLECTION}" collection`)
	} catch (err: any) {
		// guards against race conditions when multiple API instances boot at once
		if (err?.message?.includes('already exists')) {
			logger.info(`[exif-extension] "${COLLECTION}" already exists, skipping`)
			return
		}
		logger.error(err, `[exif-extension] failed to provision "${COLLECTION}"`)
	}
}
