import type { Maybe } from './types'

export const formatShutter = (seconds: Maybe<number>): string => {
	if (seconds == null || seconds <= 0) return ''

	return seconds >= 1 ? `${+seconds.toFixed(1)} s` : `1/${Math.round(1 / seconds)} s`
}

/** Many cameras repeat the make inside the model ("Canon EOS 5D"), so don't print it twice. */
export const cameraName = (make: Maybe<string>, model: Maybe<string>): string =>
	make && model?.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].filter(Boolean).join(' ')

export const formatAperture = (fNumber: Maybe<number>): string => (fNumber == null ? '' : `f/${+fNumber.toFixed(1)}`)

export const formatFocalLength = (mm: Maybe<number>): string => (mm == null ? '' : `${+mm.toFixed(1)} mm`)

export const formatGps = (latitude: Maybe<number>, longitude: Maybe<number>): string =>
	latitude == null || longitude == null ? '' : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

export const mapUrl = (latitude: number, longitude: number): string =>
	`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`

/** Takes KB; Directus stores bytes, so divide by 1024 first. */
export const formatSize = (kb: Maybe<number>): string => {
	if (kb == null) return ''

	return kb >= 1024 ? `${+(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
}

/** Stored times are the camera's wall clock saved as UTC, so show them as UTC rather than in the browser's timezone. */
export const formatTaken = (iso: Maybe<string>, { time = true, locale }: { time?: boolean; locale?: string } = {}): string =>
	iso
		? new Date(iso).toLocaleString(locale, { dateStyle: 'medium', ...(time ? { timeStyle: 'medium' } : {}), timeZone: 'UTC' })
		: ''

/** The time of day only, as UTC for the same reason as `formatTaken`. */
export const formatTakenTime = (iso: Maybe<string>, locale?: string): string =>
	iso ? new Date(iso).toLocaleTimeString(locale, { timeStyle: 'short', timeZone: 'UTC' }) : ''
