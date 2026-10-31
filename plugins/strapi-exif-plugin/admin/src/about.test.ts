import { describe, expect, it } from 'vitest'
import about, { buildAbout } from './about'

describe('buildAbout', () => {
	it('cleans the repository URL and links to the package folder', () => {
		expect(
			buildAbout({
				version: '1.2.3',
				author: 'syfqpie',
				repository: { url: 'git+https://github.com/syfqpie/tepungpelita.git' },
				homepage: 'https://github.com/syfqpie/tepungpelita/tree/main/plugins/x#readme',
				strapi: { displayName: 'EXIF Metadata' },
			}),
		).toMatchObject({
			title: 'EXIF Metadata',
			version: '1.2.3',
			author: 'syfqpie',
			repoLabel: 'syfqpie/tepungpelita',
			repoHref: 'https://github.com/syfqpie/tepungpelita/tree/main/plugins/x#readme',
		})
	})

	it('keeps only the name from "Name <email> (url)" and from author objects', () => {
		expect(buildAbout({ version: '1', author: 'Ada Lovelace <ada@example.com> (https://x.dev)' }).author).toBe('Ada Lovelace')
		expect(buildAbout({ version: '1', author: { name: 'Ada' } }).author).toBe('Ada')
	})

	it('falls back to the repository URL and tolerates missing fields', () => {
		const info = buildAbout({ version: '1', repository: 'https://github.com/a/b.git' })

		expect(info.repoHref).toBe('https://github.com/a/b')
		expect(buildAbout({ version: '1', repository: 'https://gitlab.com/a/b.git' }).repoLabel).toBe('gitlab.com/a/b')
		expect(buildAbout({ version: '1' })).toMatchObject({ title: 'EXIF', author: '', repoHref: '' })
	})

	it("describes this package from its real package.json", () => {
		expect(about.version).toMatch(/^\d+\.\d+\.\d+/)
		expect(about.author).not.toBe('')
		expect(about.repoHref).toContain('github.com')
	})
})
