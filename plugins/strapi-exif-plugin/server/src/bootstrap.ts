import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Core } from '@strapi/strapi'
import exifr from 'exifr'

import { toExifRecord } from './helpers'

const FILE_UID = 'plugin::upload.file'
const EXIF_UID = 'plugin::exif.exif-metadata'

export default ({ strapi }: { strapi: Core.Strapi }) => {
	/**
	 * Reads each uploaded image from local storage, extracts its EXIF data and
	 * upserts one `exif-metadata` entry per file. Skips non-images and files without EXIF.
	 */
	strapi.db.lifecycles.subscribe({
		models: [FILE_UID],

		async afterCreate({ result }) {
			if (!result?.mime?.startsWith('image/')) return

			try {
				// Only the local upload provider is supported; the file is read straight from disk.
				if (result.provider !== 'local') {
					strapi.log.warn(`[exif] provider "${result.provider}" is not local, skipping file ${result.id}`)
					return
				}

				const buffer = await readFile(path.join(strapi.dirs.static.public, result.url))

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
					strapi.log.info(`[exif] no EXIF data found for file ${result.id}`)
					return
				}

				const data = toExifRecord(result.id, exifData)
				const existing = await strapi.db.query(EXIF_UID).findOne({ where: { file: result.id } })

				if (existing) {
					await strapi.db.query(EXIF_UID).update({ where: { id: existing.id }, data })
				} else {
					await strapi.db.query(EXIF_UID).create({ data })
				}

				strapi.log.info(`[exif] stored EXIF data for file ${result.id}`)
			} catch (err) {
				strapi.log.error(`[exif] failed to process EXIF for file ${result.id}: ${err}`)
			}
		},

		async beforeDelete({ params }) {
			if (params?.where?.id === undefined) return

			await strapi.db.query(EXIF_UID).deleteMany({ where: { file: params.where.id } })
		},
	})
}
