import path from 'node:path'
import { defineHook } from '@directus/extensions-sdk'
import exifr from 'exifr'

import { getLocalStorageRoot, toExifRecord } from './helpers'
import { ensureCollectionExists } from './services'
import { COLLECTION } from './schemas/exif-metadata'

export default defineHook((hookEvents, context) => {
	const { action, init } = hookEvents
	const { services, getSchema, logger, env } = context

	init('app.after', () => ensureCollectionExists(context))

	/**
	 * Reads each uploaded image from local storage, extracts its EXIF data and
	 * upserts one `exif_metadata` row per file. Skips non-images and files without EXIF.
	 */
	action('files.upload', async ({ key, collection }) => {
		if (collection !== 'directus_files') return

		try {
			const schema = await getSchema()
			const filesService = new services.FilesService({ schema })
			const exifService = new services.ItemsService(COLLECTION, { schema })

			const file = await filesService.readOne(key, {
				fields: ['id', 'type', 'filename_disk', 'storage'],
			})

			if (!file.type?.startsWith('image/')) return

			// Only the local storage driver is supported; the file is read straight from disk.
			const root = getLocalStorageRoot(env, String(file.storage))

			if (root === null) {
				logger.warn(`[exif-extension] storage "${file.storage}" is not a local driver, skipping file ${key}`)
				return
			}

			// Parsing by path lets exifr read only the header chunks instead of the whole image.
			const exifData = await exifr.parse(path.resolve(root, file.filename_disk), {
				tiff: true,
				exif: true,
				gps: true,
				iptc: false,
				icc: false,
				jfif: false,
				xmp: false,
				makerNote: false,
				userComment: false,
			})

			if (!exifData) {
				logger.info(`[exif-extension] no EXIF data found for file ${key}`)
				return
			}

			const record = toExifRecord(key, exifData)

			const existing = await exifService.readByQuery({
				filter: { file: { _eq: key } },
				fields: ['id'],
				limit: 1,
			})

			if (existing.length > 0) {
				await exifService.updateOne(existing[0].id, record)
			} else {
				await exifService.createOne(record)
			}

			logger.info(`[exif-extension] stored EXIF data for file ${key}`)
		} catch (err) {
			logger.error(err, `[exif-extension] failed to process EXIF for file ${key}`)
		}
	})
})
