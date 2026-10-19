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
