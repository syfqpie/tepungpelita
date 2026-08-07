import { defineHook } from '@directus/extensions-sdk'
import exifr from 'exifr'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ensureCollectionExists } from './ensure-collection'
import { COLLECTION } from './collection-schema'

export default defineHook((hookEvents, context) => {
	const { action, init } = hookEvents
	const { services, getSchema, logger, env } = context

	init('app.after', () => ensureCollectionExists(context))

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

			const root = env['STORAGE_LOCAL_ROOT'] ?? './uploads'
			const filePath = path.resolve(root, file.filename_disk)
			const buffer = await readFile(filePath)

			const exifData = await exifr.parse(buffer, {
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

			const record: Record<string, any> = {
				file: key,
				camera_make: exifData.Make ?? null,
				camera_model: exifData.Model ?? null,
				lens_model: exifData.LensModel ?? null,
				date_taken: exifData.DateTimeOriginal ?? exifData.CreateDate ?? null,
				orientation: exifData.Orientation ?? null,
				iso: exifData.ISO ?? null,
				focal_length: exifData.FocalLength ?? null,
				aperture: exifData.FNumber ?? null,
				exposure_time: exifData.ExposureTime ?? null,
				gps_latitude: exifData.latitude ?? null,
				gps_longitude: exifData.longitude ?? null,
				gps_altitude: exifData.GPSAltitude ?? null,
				raw: exifData,
			}

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
