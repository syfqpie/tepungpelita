export interface Filters {
	search: string
	/** A folder id; its subfolders are included. */
	folder: string | null
}

/** Field paths to search; a path through the `file` relation is nested, never a dotted key. */
export const SEARCH_FIELDS = [['camera_make'], ['camera_model'], ['lens_model'], ['file', 'filename_download'], ['file', 'title']]

export const hasFilters = ({ search, folder }: Filters): boolean => search.trim() !== '' || folder !== null

/** `['file', 'title']` + rule -> `{ file: { title: rule } }`. Directus rejects dotted keys like "file.title" with a 403. */
const nest = (path: string[], rule: object): object => path.reduceRight<object>((inner, key) => ({ [key]: inner }), rule)

/** Directus filter for the items API, or null when nothing is filtered. `folderIds` is the chosen folder and its descendants. */
export const buildFilter = (search: string, folderIds: string[] | null) => {
	const term = search.trim()
	const parts = [
		...(term ? [{ _or: SEARCH_FIELDS.map((path) => nest(path, { _icontains: term })) }] : []),
		...(folderIds ? [nest(['file', 'folder'], { _in: folderIds })] : []),
	]

	return parts.length === 0 ? null : parts.length === 1 ? parts[0]! : { _and: parts }
}
