import pkg from '../../package.json'

interface PackageInfo {
	version: string
	description?: string
	author?: string | { name?: string }
	homepage?: string
	repository?: string | { url?: string }
	strapi?: { displayName?: string }
}

export interface About {
	title: string
	description: string
	version: string
	author: string
	repoLabel: string
	repoHref: string
}

/** `git+https://github.com/me/repo.git` -> `https://github.com/me/repo` */
const cleanRepoUrl = (url: string): string => url.replace(/^git\+/, '').replace(/\.git$/, '')

/** Reads the plugin's own package.json, so the version and links can't drift from what was released. */
export const buildAbout = (info: PackageInfo): About => {
	const repository = typeof info.repository === 'string' ? info.repository : (info.repository?.url ?? '')
	const author = typeof info.author === 'string' ? info.author : (info.author?.name ?? '')
	const repoUrl = cleanRepoUrl(repository)

	return {
		title: info.strapi?.displayName ?? 'EXIF',
		description: info.description ?? '',
		version: info.version,
		// "Name <email> (url)" -> "Name"
		author: author.replace(/\s*[<(].*$/, '').trim(),
		// "syfqpie/tepungpelita" for GitHub (short enough to stay on one line), host + path elsewhere.
		repoLabel: repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/^https?:\/\//, ''),
		// Prefer the package's own folder (homepage) over the repository root in this monorepo.
		repoHref: info.homepage ?? repoUrl,
	}
}

export default buildAbout(pkg)
