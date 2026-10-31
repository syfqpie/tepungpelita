import type { Maybe } from './types'

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
