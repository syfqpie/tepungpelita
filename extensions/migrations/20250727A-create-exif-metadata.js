export async function up(knex) {
	// 1. Underlying table
	await knex.schema.createTable('exif_metadata', (table) => {
		table.uuid('id').primary().notNullable()
		table
			.uuid('file')
			.unique()
			.notNullable()
			.references('id')
			.inTable('directus_files')
			.onDelete('CASCADE')

		table.string('camera_make', 255)
		table.string('camera_model', 255)
		table.string('lens_model', 255)
		table.timestamp('date_taken')
		table.integer('orientation')
		table.integer('iso')
		table.decimal('focal_length', 10, 2)
		table.decimal('aperture', 10, 2)
		table.decimal('exposure_time', 10, 6)
		table.decimal('gps_latitude', 10, 7)
		table.decimal('gps_longitude', 10, 7)
		table.decimal('gps_altitude', 10, 2)
		table.json('raw')

		table.timestamp('date_created').defaultTo(knex.fn.now())
	})

	// 2. Register the collection
	await knex('directus_collections').insert({
		collection: 'exif_metadata',
		icon: 'photo_camera',
		note: 'EXIF metadata extracted from uploaded images (one row per file).',
		display_template: '{{camera_make}} {{camera_model}}',
		hidden: false,
		singleton: false,
		accountability: 'all',
	})

	// 3. Register fields so they render nicely in the Data Studio
	const fields = [
		{ field: 'id', interface: 'input', special: 'uuid', readonly: true, hidden: true, sort: 1 },
		{
			field: 'file',
			interface: 'select-dropdown-m2o',
			display: 'related-values',
			display_options: JSON.stringify({ template: '{{filename_download}}' }),
			options: JSON.stringify({ template: '{{filename_download}}' }),
			required: true,
			sort: 2,
		},
		{ field: 'camera_make', interface: 'input', width: 'half', sort: 3 },
		{ field: 'camera_model', interface: 'input', width: 'half', sort: 4 },
		{ field: 'lens_model', interface: 'input', width: 'half', sort: 5 },
		{ field: 'date_taken', interface: 'datetime', width: 'half', sort: 6 },
		{ field: 'orientation', interface: 'input', width: 'half', sort: 7 },
		{ field: 'iso', interface: 'input', width: 'half', sort: 8 },
		{ field: 'focal_length', interface: 'input', width: 'half', sort: 9 },
		{ field: 'aperture', interface: 'input', width: 'half', sort: 10 },
		{ field: 'exposure_time', interface: 'input', width: 'half', sort: 11 },
		{ field: 'gps_latitude', interface: 'input', width: 'third', sort: 12 },
		{ field: 'gps_longitude', interface: 'input', width: 'third', sort: 13 },
		{ field: 'gps_altitude', interface: 'input', width: 'third', sort: 14 },
		{
			field: 'raw',
			interface: 'input-code',
			special: 'cast-json',
			options: JSON.stringify({ language: 'json' }),
			sort: 15,
		},
		{ field: 'date_created', interface: 'datetime', special: 'date-created', readonly: true, width: 'half', sort: 16 },
	]

	for (const f of fields) {
		await knex('directus_fields').insert({
			collection: 'exif_metadata',
			field: f.field,
			special: f.special ?? null,
			interface: f.interface ?? null,
			options: f.options ?? null,
			display: f.display ?? null,
			display_options: f.display_options ?? null,
			readonly: f.readonly ?? false,
			hidden: f.hidden ?? false,
			required: f.required ?? false,
			width: f.width ?? 'full',
			sort: f.sort,
		})
	}

	// 4. Register the relation: exif_metadata.file -> directus_files.id
	await knex('directus_relations').insert({
		many_collection: 'exif_metadata',
		many_field: 'file',
		one_collection: 'directus_files',
		one_deselect_action: 'nullify',
	})
}

export async function down(knex) {
	await knex('directus_relations')
		.where({ many_collection: 'exif_metadata', many_field: 'file' })
		.delete()

	await knex('directus_fields').where({ collection: 'exif_metadata' }).delete()
	await knex('directus_collections').where({ collection: 'exif_metadata' }).delete()

	await knex.schema.dropTableIfExists('exif_metadata')
}
