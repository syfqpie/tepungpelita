import { defineHook } from '@directus/extensions-sdk'

const COLLECTION = 'exif_metadata'

export default defineHook(({ action }, { services, getSchema, database, logger }) => {
	// Runs once per process start. Ensures the exif_metadata collection, its
	// fields and its relation to directus_files exist.
	action('server.start', async () => {
		try {
			const hasTable = await database.schema.hasTable(COLLECTION)

			if (hasTable) {
				logger.info(`[exif-extension] "${COLLECTION}" collection exists, skipping bootstrap`)
				return
			}

			const schema = await getSchema()
			const { CollectionsService, FieldsService, RelationsService } = services

			const collectionsService = new CollectionsService({ schema, knex: database })

			await collectionsService.createOne({
				collection: COLLECTION,
				meta: {
					icon: 'photo_camera',
					note: 'EXIF metadata extracted from uploaded image files.',
					hidden: false,
				},
				schema: {},
				fields: [
					{
						field: 'id',
						type: 'uuid',
						meta: { hidden: true, interface: 'input', readonly: true },
						schema: { is_primary_key: true, has_auto_increment: false },
					},
				],
			} as any)

			// FieldsService/RelationsService need a schema that already knows about
			// the collection just created.
			const schemaAfterCollection = await getSchema()
			const fieldsService = new FieldsService({ schema: schemaAfterCollection, knex: database })
			const relationsService = new RelationsService({ schema: schemaAfterCollection, knex: database })

			await fieldsService.createField(COLLECTION, {
				field: 'file',
				type: 'uuid',
				meta: {
					interface: 'select-dropdown-m2o',
					special: ['m2o'],
					note: 'The file this EXIF data was extracted from.',
				},
				schema: { is_nullable: false, is_unique: true },
			} as any)

			await relationsService.createOne({
				collection: COLLECTION,
				field: 'file',
				related_collection: 'directus_files',
				schema: { on_delete: 'CASCADE' },
				meta: {},
			} as any)

			const structuredFields: Array<{ field: string; type: string; note: string }> = [
				{ field: 'taken_at', type: 'timestamp', note: 'Date/time the photo was taken (DateTimeOriginal/CreateDate).' },
				{ field: 'camera_make', type: 'string', note: 'Camera manufacturer (Make).' },
				{ field: 'camera_model', type: 'string', note: 'Camera model (Model).' },
				{ field: 'lens_model', type: 'string', note: 'Lens model (LensModel).' },
				{ field: 'gps_latitude', type: 'decimal', note: 'GPS latitude in decimal degrees.' },
				{ field: 'gps_longitude', type: 'decimal', note: 'GPS longitude in decimal degrees.' },
				{ field: 'gps_altitude', type: 'decimal', note: 'GPS altitude in meters.' },
				{ field: 'iso', type: 'integer', note: 'ISO sensitivity.' },
				{ field: 'aperture', type: 'decimal', note: 'Aperture (FNumber).' },
				{ field: 'exposure_time', type: 'decimal', note: 'Exposure/shutter time in seconds.' },
				{ field: 'focal_length', type: 'decimal', note: 'Focal length in millimeters.' },
				{ field: 'orientation', type: 'integer', note: 'EXIF orientation tag.' },
			]

			for (const { field, type, note } of structuredFields) {
				await fieldsService.createField(COLLECTION, {
					field,
					type,
					meta: { interface: type === 'timestamp' ? 'datetime' : 'input', note, readonly: true },
					schema: { is_nullable: true },
				} as any)
			}

			await fieldsService.createField(COLLECTION, {
				field: 'raw',
				type: 'json',
				meta: {
					interface: 'input-code',
					options: { language: 'json' },
					note: 'Full raw EXIF/GPS payload as parsed by exifr, for anything not covered by the structured fields above.',
					readonly: true,
				},
				schema: { is_nullable: true },
			} as any)

			logger.info(`[exif-extension] created "${COLLECTION}" collection`)
		} catch (err) {
			logger.error(err, `[exif-extension] failed to bootstrap "${COLLECTION}" collection`)
		}
	})
})
