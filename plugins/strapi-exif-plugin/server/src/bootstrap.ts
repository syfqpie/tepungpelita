import path from 'node:path'
import type { Core } from '@strapi/strapi'
import exifr from 'exifr'

import { EXIF_UID, FILE_UID } from './constants'
import { canReadExif, EXIF_OPTIONS, toExifRecord } from './helpers'


/** Carries EXIF read from the original upload through Strapi's file data to the lifecycle hooks. */
const EXIF_KEY = '_exif'

type Exif = Awaited<ReturnType<typeof exifr.parse>>

export default ({ strapi }: { strapi: Core.Strapi }) => {
	const removeExif = (fileId: number) => strapi.db.query(EXIF_UID).deleteMany({ where: { file: fileId } })

	// Parsing by path lets exifr read only the header chunks instead of the whole image.
	const readExif = (filePath: string): Promise<Exif> =>
		exifr.parse(filePath, EXIF_OPTIONS)

	// Strapi's size optimization and auto-orientation re-encode the image with `sharp`, which drops EXIF.
	// The service is looked up on every upload, so wrapping it lets us read the original first.
	const imageManipulation = strapi.plugin('upload').service('image-manipulation') as {
		optimize: (file: { filepath?: string; mime?: string }) => Promise<unknown>
	}
	const optimize = imageManipulation.optimize

	imageManipulation.optimize = async (file) => {
		try {
			if (file.filepath && canReadExif(file.mime)) Object.assign(file, { [EXIF_KEY]: (await readExif(file.filepath)) ?? null })
		} catch (err) {
			strapi.log.warn(`[exif] could not read EXIF before optimization: ${err}`)
		}

		return optimize(file)
	}

	/**
	 * Upserts one `exif-metadata` entry per image. Uses the EXIF captured before optimization
	 * (`null` = none found) and falls back to reading the stored file from local storage.
	 * Skips formats exifr can't read; files without EXIF drop any old entry.
	 */
	const syncExif = async (file: { id: number; mime?: string; provider?: string; url: string }, captured?: Exif | null) => {
		if (!canReadExif(file.mime)) return

		try {
			let exifData = captured

			if (exifData === undefined) {
				// Only the local upload provider can be read back; the file is read straight from disk.
				if (file.provider !== 'local') {
					strapi.log.warn(`[exif] provider "${file.provider}" is not local, skipping file ${file.id}`)
					return
				}

				exifData = await readExif(path.join(strapi.dirs.static.public, file.url))
			}

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

		async afterCreate({ params, result }) {
			await syncExif(result, params?.data?.[EXIF_KEY])
		},

		// "Replace media" updates the file row with new bytes; info edits (alt text, caption) don't carry `size`.
		async afterUpdate({ params, result }) {
			if (params?.data?.size === undefined) return

			await syncExif(result, params.data[EXIF_KEY])
		},

		async beforeDelete({ params }) {
			if (params?.where?.id === undefined) return

			await removeExif(params.where.id)
		},
	})
}
