import type { Maybe } from './types'

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
