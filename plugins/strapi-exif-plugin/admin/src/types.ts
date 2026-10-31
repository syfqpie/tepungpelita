export interface ExifFile {
	id: number
	name: string
	url: string
	mime?: string | null
	/** Size in KB, as Strapi stores it. */
	size?: number | null
	width?: number | null
	height?: number | null
	formats?: Record<string, { url: string }> | null
}

export interface ExifRow {
	id: number
	cameraMake: string | null
	cameraModel: string | null
	lensModel: string | null
	dateTaken: string | null
	iso: number | null
	focalLength: number | null
	aperture: number | null
	exposureTime: number | null
	gpsLatitude: number | null
	gpsLongitude: number | null
	gpsAltitude: number | null
	raw?: Record<string, unknown> | null
	file?: ExifFile | null
}

export interface ExifFolder {
	id: number
	/** A folder's `path` is built from `pathId`s, not ids. */
	pathId: number
	name: string
	path: string
}
