/**
 * `exifr` options. `translateValues: false` keeps tags numeric: by default it turns some into
 * text (e.g. Orientation 8 -> "Rotate 270 CW"), which the integer columns reject.
 */
export const EXIF_OPTIONS = {
	tiff: true,
	exif: true,
	gps: true,
	iptc: false,
	icc: false,
	jfif: false,
	xmp: false,
	makerNote: false,
	userComment: false,
	translateValues: false,
}

/** Formats `exifr` can read. It throws "Unknown file format" for anything else (WebP, GIF, SVG...). */
const EXIF_MIME_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/heic', 'image/heif', 'image/avif']

export const canReadExif = (mime?: string): boolean => EXIF_MIME_TYPES.includes(mime ?? '')

/** EXIF tags as returned by `exifr`; only the ones we read are typed. */
export interface ExifData {
	Make?: string
	Model?: string
	LensModel?: string
	DateTimeOriginal?: Date
	CreateDate?: Date
	Orientation?: number
	ISO?: number
	FocalLength?: number
	FNumber?: number
	ExposureTime?: number
	GPSAltitude?: number
	latitude?: number
	longitude?: number
	[tag: string]: unknown
}

/**
 * `exifr` builds dates in the server's timezone, but EXIF times are the camera's wall clock with no
 * timezone. Reading those local fields back as UTC makes the stored time the same on any server.
 */
const toWallClockUtc = (date: Date): Date =>
	new Date(
		Date.UTC(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			date.getHours(),
			date.getMinutes(),
			date.getSeconds(),
			date.getMilliseconds(),
		),
	)

const withWallClockDates = (exifData: ExifData): ExifData =>
	Object.fromEntries(
		Object.entries(exifData).map(([tag, value]) => [tag, value instanceof Date ? toWallClockUtc(value) : value]),
	) as ExifData

/** Maps parsed EXIF data to an `exif-metadata` entry; missing tags become `null`. */
export const toExifRecord = (fileId: number, parsed: ExifData) => {
	const exifData = withWallClockDates(parsed)

	return {
		file: fileId,
		cameraMake: exifData.Make ?? null,
		cameraModel: exifData.Model ?? null,
		lensModel: exifData.LensModel ?? null,
		dateTaken: exifData.DateTimeOriginal ?? exifData.CreateDate ?? null,
		orientation: exifData.Orientation ?? null,
		iso: exifData.ISO ?? null,
		focalLength: exifData.FocalLength ?? null,
		aperture: exifData.FNumber ?? null,
		exposureTime: exifData.ExposureTime ?? null,
		gpsLatitude: exifData.latitude ?? null,
		gpsLongitude: exifData.longitude ?? null,
		gpsAltitude: exifData.GPSAltitude ?? null,
		raw: exifData,
	}
}

type StoredFile = {
	name: string
	url: string
	mime?: string | null
	size?: number | null
	width?: number | null
	height?: number | null
	formats?: Record<string, { url: string }> | null
}

/**
 * Picks what the admin page shows from a stored entry. The file is copied field by field so internal
 * columns (provider metadata, creator, ...) never reach the browser.
 */
export const toImage = (row: Record<string, unknown> & { file?: StoredFile | null }) => ({
	id: row.id,
	cameraMake: row.cameraMake,
	cameraModel: row.cameraModel,
	lensModel: row.lensModel,
	dateTaken: row.dateTaken,
	iso: row.iso,
	focalLength: row.focalLength,
	aperture: row.aperture,
	exposureTime: row.exposureTime,
	gpsLatitude: row.gpsLatitude,
	gpsLongitude: row.gpsLongitude,
	gpsAltitude: row.gpsAltitude,
	raw: row.raw,
	file: row.file
		? {
				name: row.file.name,
				url: row.file.url,
				mime: row.file.mime,
				size: row.file.size,
				width: row.file.width,
				height: row.file.height,
				formats: row.file.formats,
			}
		: null,
})
