import type { ExifFile } from './types'

type Maybe<T> = T | null | undefined

export const formatShutter = (seconds: Maybe<number>): string => {
	if (seconds == null || seconds <= 0) return ''

	return seconds >= 1 ? `${+seconds.toFixed(1)} s` : `1/${Math.round(1 / seconds)} s`
}

export const formatAperture = (fNumber: Maybe<number>): string => (fNumber == null ? '' : `f/${+fNumber.toFixed(1)}`)

export const formatFocalLength = (mm: Maybe<number>): string => (mm == null ? '' : `${+mm.toFixed(1)} mm`)

export const formatGps = (latitude: Maybe<number>, longitude: Maybe<number>): string =>
	latitude == null || longitude == null ? '' : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

export const mapUrl = (latitude: number, longitude: number): string =>
	`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`

/** Local-provider URLs are relative to the Strapi backend, which can differ from the admin's origin. */
export const assetUrl = (url: string, backendUrl = ''): string => (url.startsWith('/') ? `${backendUrl}${url}` : url)

export const thumbUrl = (file: ExifFile): string => file.formats?.thumbnail?.url ?? file.url

export const previewUrl = (file: ExifFile): string => file.formats?.medium?.url ?? file.formats?.small?.url ?? file.url

/** Strapi stores file sizes in KB. */
export const formatSize = (kb: Maybe<number>): string => {
	if (kb == null) return ''

	return kb >= 1024 ? `${+(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
}

/** Makes one raw EXIF value readable: no control characters, byte arrays as numbers, objects as JSON. */
export const formatTagValue = (value: unknown): string => {
	if (value == null) return ''
	if (typeof value === 'string') return value.replace(/\p{Cc}/gu, '').trim()
	if (Array.isArray(value)) return value.map(formatTagValue).join(', ')
	if (typeof value === 'object') {
		const entries = Object.entries(value)

		// exifr returns binary tags as Uint8Array, which arrive here as { "0": 80, "1": 114, ... }
		if (entries.length > 0 && entries.every(([key]) => /^\d+$/.test(key))) {
			const bytes = entries.map(([, byte]) => String(byte))

			return bytes.length > 8 ? `${bytes.slice(0, 8).join(' ')} … (${bytes.length} bytes)` : bytes.join(' ')
		}

		return JSON.stringify(value)
	}

	return String(value)
}

/** Every raw tag as sorted [name, readable value] pairs; empty values are kept so nothing is hidden. */
export const tagEntries = (raw: Maybe<Record<string, unknown>>): [string, string][] =>
	Object.entries(raw ?? {})
		.map(([name, value]): [string, string] => [name, formatTagValue(value)])
		.sort(([a], [b]) => a.localeCompare(b))

/** Stored times are the camera's wall clock saved as UTC, so show them as UTC rather than in the browser's timezone. */
export const formatTaken = (iso: Maybe<string>, { time = true, locale }: { time?: boolean; locale?: string } = {}): string =>
	iso
		? new Date(iso).toLocaleString(locale, { dateStyle: 'medium', ...(time ? { timeStyle: 'medium' } : {}), timeZone: 'UTC' })
		: ''
