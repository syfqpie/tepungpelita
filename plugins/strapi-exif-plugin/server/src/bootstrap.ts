import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Core } from '@strapi/strapi'
import exifr from 'exifr'

import { toExifRecord } from './helpers'

const FILE_UID = 'plugin::upload.file'
const EXIF_UID = 'plugin::exif.exif-metadata'

export default ({ strapi }: { strapi: Core.Strapi }) => {
	const removeExif = (fileId: number) => strapi.db.query(EXIF_UID).deleteMany({ where: { file: fileId } })

	/**
	 * Reads an uploaded image from local storage, extracts its EXIF data and upserts
	 * one `exif-metadata` entry per file. Skips non-images; files without EXIF drop any old entry.
	 */
	const syncExif = async (file: { id: number; mime?: string; provider?: string; url: string }) => {
		if (!file.mime?.startsWith('image/')) return

		try {
			// Only the local upload provider is supported; the file is read straight from disk.
			if (file.provider !== 'local') {
				strapi.log.warn(`[exif] provider "${file.provider}" is not local, skipping file ${file.id}`)
				return
			}

			const buffer = await readFile(path.join(strapi.dirs.static.public, file.url))

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
				// A replaced image must not keep the previous image's EXIF (e.g. its GPS).
				await removeExif(file.id)
				strapi.log.info(`[exif] no EXIF data found for file ${file.id}`)
				return
			}

			const data = toExifRecord(file.id, exifData)
			const existing = await strapi.db.query(EXIF_UID).findOne({ where: { file: file.id } })

			if (existing) {
				await strapi.db.query(EXIF_UID).update({ where: { id: existing.id }, data })
			} else {
				await strapi.db.query(EXIF_UID).create({ data })
			}

			strapi.log.info(`[exif] stored EXIF data for file ${file.id}`)
		} catch (err) {
			strapi.log.error(`[exif] failed to process EXIF for file ${file.id}: ${err}`)
		}
	}

	strapi.db.lifecycles.subscribe({
		models: [FILE_UID],

		async afterCreate({ result }) {
			await syncExif(result)
		},

		// "Replace media" updates the file row with new bytes; info edits (alt text, caption) don't carry `size`.
		async afterUpdate({ params, result }) {
			if (params?.data?.size === undefined) return

			await syncExif(result)
		},

		async beforeDelete({ params }) {
			if (params?.where?.id === undefined) return

			await removeExif(params.where.id)
		},
	})
}
