import { describe, expect, it } from 'vitest'
import about from './about'

describe('about', () => {
	it("describes this package from its real package.json", () => {
		expect(about.version).toMatch(/^\d+\.\d+\.\d+/)
		expect(about.author).not.toBe('')
		expect(about.repoHref).toContain('github.com')
	})
})
