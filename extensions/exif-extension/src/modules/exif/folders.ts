export interface Folder {
	id: string
	name: string
	parent: string | null
}

/** Folder choices labelled with their ancestry ("Trips / 2025"), sorted by that label. */
export const folderOptions = (folders: Folder[]): { value: string; text: string }[] => {
	const byId = new Map(folders.map((folder) => [folder.id, folder]))

	const label = (folder: Folder): string => {
		const names: string[] = []
		const seen = new Set<string>()

		// `seen` stops a corrupt parent cycle from looping forever.
		for (let next: Folder | undefined = folder; next && !seen.has(next.id); next = next.parent ? byId.get(next.parent) : undefined) {
			seen.add(next.id)
			names.unshift(next.name)
		}

		return names.join(' / ')
	}

	return folders.map((folder) => ({ value: folder.id, text: label(folder) })).sort((a, b) => a.text.localeCompare(b.text))
}

/** The folder's id plus the ids of every folder below it. */
export const withDescendants = (folders: Folder[], id: string): string[] => {
	const ids = [id]

	// `ids` grows while we loop, so each newly added folder is visited for its own children.
	for (const current of ids) {
		for (const folder of folders) if (folder.parent === current && !ids.includes(folder.id)) ids.push(folder.id)
	}

	return ids
}
