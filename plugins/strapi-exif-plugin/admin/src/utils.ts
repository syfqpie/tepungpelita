import { type Maybe } from '@tepungpelita/exif-ui-core'

import type { ExifFile, ExifFolder, ExifRow } from './types'

export * from '@tepungpelita/exif-ui-core'

/** Local-provider URLs are relative to the Strapi backend, which can differ from the admin's origin. */
export const assetUrl = (url: string, backendUrl = ''): string => (url.startsWith('/') ? `${backendUrl}${url}` : url)

export const thumbUrl = (file: ExifFile): string => file.formats?.thumbnail?.url ?? file.url

export const previewUrl = (file: ExifFile): string => file.formats?.medium?.url ?? file.formats?.small?.url ?? file.url

export const backendUrl = (): string =>
	(window as unknown as { strapi?: { backendURL?: string } }).strapi?.backendURL ?? ''

/** A spreadsheet runs text starting with = + - @ as a formula, and filenames and camera strings come from uploaders. */
const csvText = (value: string): string => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value)

const csvCell = (value: string | number | null | undefined): string => {
	if (value == null) return ''

	const text = typeof value === 'number' ? String(value) : csvText(value)

	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const CSV_COLUMNS: [string, (row: ExifRow, origin: string) => string | number | null | undefined][] = [
	['File', (row) => row.file?.name],
	['File ID', (row) => row.file?.id],
	['Image URL', (row, origin) => (row.file ? assetUrl(row.file.url, origin) : '')],
	['Camera make', (row) => row.cameraMake],
	['Camera model', (row) => row.cameraModel],
	['Lens', (row) => row.lensModel],
	// The camera's clock time, so no timezone suffix.
	['Taken', (row) => row.dateTaken?.slice(0, 19).replace('T', ' ')],
	['ISO', (row) => row.iso],
	['Aperture', (row) => row.aperture],
	['Shutter (s)', (row) => row.exposureTime],
	['Focal length (mm)', (row) => row.focalLength],
	['Latitude', (row) => row.gpsLatitude],
	['Longitude', (row) => row.gpsLongitude],
	['Altitude (m)', (row) => row.gpsAltitude],
]

/** One line per image with the main settings. The full tag list is in the per-image JSON download. */
export const toCsv = (rows: ExifRow[], origin: string): string =>
	[CSV_COLUMNS.map(([header]) => header), ...rows.map((row) => CSV_COLUMNS.map(([, value]) => value(row, origin)))]
		.map((line) => line.map(csvCell).join(','))
		.join('\r\n')

/** `DSCF8531.JPG` -> `DSCF8531-exif.json`, safe to use as a download name. */
export const jsonFileName = (name: Maybe<string>): string =>
	`${(name ?? 'image').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_') || 'image'}-exif.json`

export const saveFile = (filename: string, mime: string, content: string): void => {
	const url = URL.createObjectURL(new Blob([content], { type: mime }))
	const link = document.createElement('a')

	link.href = url
	link.download = filename
	link.click()
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Folder choices labelled with their ancestry ("Trips / 2025"), sorted by that label. */
export const folderOptions = (folders: ExifFolder[]): { value: string; label: string }[] => {
	const nameByPathId = new Map(folders.map((folder) => [String(folder.pathId), folder.name]))

	return folders
		.map((folder) => ({
			value: String(folder.id),
			label:
				folder.path
					.split('/')
					.filter(Boolean)
					.map((pathId) => nameByPathId.get(pathId) ?? pathId)
					.join(' / ') || folder.name,
		}))
		.sort((a, b) => a.label.localeCompare(b.label))
}
