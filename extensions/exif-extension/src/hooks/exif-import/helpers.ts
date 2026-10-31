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

/** Maps parsed EXIF data to an `exif_metadata` row; missing tags become `null`. */
export const toExifRecord = (fileId: string, parsed: ExifData) => {
	const exifData = withWallClockDates(parsed)

	return {
		file: fileId,
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
}

/**
 * Returns the root directory of a storage location, or `null` if the location
 * doesn't use the local driver (the only one supported).
 */
export const getLocalStorageRoot = (env: Record<string, unknown>, storage: string): string | null => {
	const location = storage.toUpperCase()

	if (env[`STORAGE_${location}_DRIVER`] !== 'local') return null

	return String(env[`STORAGE_${location}_ROOT`] ?? './uploads')
}
