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

/** Maps parsed EXIF data to an `exif-metadata` entry; missing tags become `null`. */
export const toExifRecord = (fileId: number, exifData: ExifData) => ({
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
})
