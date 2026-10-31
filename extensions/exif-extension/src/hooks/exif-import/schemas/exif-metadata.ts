import type { RawCollection, Relation } from "@directus/types"

export const COLLECTION = 'exif_metadata'

/**
 * Collection definition for `exif_metadata`.
 */
export const collectionMeta = {
	collection: COLLECTION,
	meta: {
		icon: 'camera',
		note: 'EXIF metadata extracted from uploaded images (one row per file).',
		display_template: '{{camera_make}} {{camera_model}}',
	},
	schema: {},
	fields: [
		{
			field: 'id',
			type: 'uuid',
			meta: { interface: 'input', special: ['uuid'], readonly: true, hidden: true },
			schema: { is_primary_key: true, has_auto_increment: false },
		},
		{
			field: 'file',
			type: 'uuid',
			meta: {
				interface: 'select-dropdown-m2o',
				display: 'related-values',
				display_options: { template: '{{filename_download}}' },
				options: { template: '{{filename_download}}' },
				required: true,
			},
			schema: { is_nullable: false, is_unique: true },
		},
		{ field: 'camera_make', type: 'string', meta: { interface: 'input', width: 'half' } },
		{ field: 'camera_model', type: 'string', meta: { interface: 'input', width: 'half' } },
		{ field: 'lens_model', type: 'string', meta: { interface: 'input', width: 'half' } },
		{ field: 'date_taken', type: 'timestamp', meta: { interface: 'datetime', width: 'half' } },
		{ field: 'orientation', type: 'integer', meta: { interface: 'input', width: 'half' } },
		{ field: 'iso', type: 'integer', meta: { interface: 'input', width: 'half' } },
		{ field: 'focal_length', type: 'decimal', meta: { interface: 'input', width: 'half' } },
		{ field: 'aperture', type: 'decimal', meta: { interface: 'input', width: 'half' } },
		{
			field: 'exposure_time',
			type: 'decimal',
			meta: { interface: 'input', width: 'half' },
			// Directus' default scale of 5 would round fast shutters (1/8000 s = 0.000125) to 0.00013.
			schema: { numeric_precision: 12, numeric_scale: 8 },
		},
		{ field: 'gps_latitude', type: 'decimal', meta: { interface: 'input', width: 'half' } },
		{ field: 'gps_longitude', type: 'decimal', meta: { interface: 'input', width: 'half' } },
		{ field: 'gps_altitude', type: 'decimal', meta: { interface: 'input', width: 'half' } },
		{
			field: 'raw',
			type: 'json',
			meta: { interface: 'input-code', special: ['cast-json'], options: { language: 'json' } },
		},
		{
			field: 'date_created',
			type: 'timestamp',
			meta: { special: ['date-created'], interface: 'datetime', readonly: true, width: 'half' },
		},
	],
} as RawCollection

/**
 * One-to-one link from `exif_metadata.file` to `directus_files.id`; rows are deleted with their file.
 *
 * Directus types `schema` and `meta` as the full introspected relation, but `RelationsService.createOne`
 * only needs the parts below, so this is cast the same way `collectionMeta` is.
 */
export const relationDefinition = {
	collection: COLLECTION,
	field: 'file',
	related_collection: 'directus_files',
	schema: {
		on_delete: 'CASCADE',
	},
	meta: { one_deselect_action: 'nullify' },
} as unknown as Partial<Relation> & Pick<Relation, 'collection' | 'field'>
