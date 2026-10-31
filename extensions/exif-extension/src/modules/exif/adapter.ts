import type { ExifFile, ExifRow } from './types'

type Num = number | string | null | undefined

interface FileItem {
	id: string
	filename_download?: string | null
	title?: string | null
	type?: string | null
	filesize?: Num
	width?: Num
	height?: Num
	folder?: string | null
}

/** One `exif_metadata` item as the Directus items API returns it. */
export interface ExifItem {
	id: string
	camera_make?: string | null
	camera_model?: string | null
	lens_model?: string | null
	date_taken?: string | null
	iso?: Num
	focal_length?: Num
	aperture?: Num
	exposure_time?: Num
	gps_latitude?: Num
	gps_longitude?: Num
	gps_altitude?: Num
	raw?: Record<string, unknown> | null
	/** An object when the file fields were requested, otherwise just its id. */
	file?: FileItem | string | null
}

/** Postgres and MySQL return decimals as strings. */
const num = (value: Num): number | null => {
	if (value == null || value === '') return null

	const parsed = Number(value)

	return Number.isFinite(parsed) ? parsed : null
}

const toFile = (file: ExifItem['file']): ExifFile | null =>
	file && typeof file === 'object'
		? {
				id: file.id,
				name: file.filename_download ?? null,
				title: file.title ?? null,
				type: file.type ?? null,
				size: num(file.filesize),
				width: num(file.width),
				height: num(file.height),
				folder: file.folder ?? null,
			}
		: null

/** Maps an `exif_metadata` item (snake_case, decimals as strings) to the camelCase shape the page uses. */
export const toExifRow = (item: ExifItem): ExifRow => ({
	id: item.id,
	cameraMake: item.camera_make ?? null,
	cameraModel: item.camera_model ?? null,
	lensModel: item.lens_model ?? null,
	dateTaken: item.date_taken ?? null,
	iso: num(item.iso),
	focalLength: num(item.focal_length),
	aperture: num(item.aperture),
	exposureTime: num(item.exposure_time),
	gpsLatitude: num(item.gps_latitude),
	gpsLongitude: num(item.gps_longitude),
	gpsAltitude: num(item.gps_altitude),
	raw: item.raw ?? null,
	file: toFile(item.file),
})
