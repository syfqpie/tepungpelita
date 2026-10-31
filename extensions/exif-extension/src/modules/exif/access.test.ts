import { describe, expect, it } from 'vitest'
import { canSeeModule } from './access'

const read = (access: 'none' | 'partial' | 'full') => ({ exif_metadata: { read: { access } } }) as never

describe('canSeeModule', () => {
	it('shows the module to admins, whatever the permissions are', () => {
		expect(canSeeModule({ admin_access: true }, {})).toBe(true)
	})

	it('shows it to roles with full or filtered read access', () => {
		expect(canSeeModule({ admin_access: false }, read('full'))).toBe(true)
		expect(canSeeModule({ admin_access: false }, read('partial'))).toBe(true)
	})

	it('hides it from roles without read access, including when the collection is missing', () => {
		expect(canSeeModule({ admin_access: false }, read('none'))).toBe(false)
		expect(canSeeModule({ admin_access: false }, {})).toBe(false)
		expect(canSeeModule({}, {})).toBe(false)
	})
})
