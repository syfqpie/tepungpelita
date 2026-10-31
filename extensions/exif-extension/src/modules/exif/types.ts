export interface ExifFile {
	id: string
	name: string | null
	title: string | null
	type: string | null
	/** Bytes, as Directus stores them. */
	size: number | null
	width: number | null
	height: number | null
	folder: string | null
}

export interface ExifRow {
	id: string
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
	raw: Record<string, unknown> | null
	file: ExifFile | null
}
