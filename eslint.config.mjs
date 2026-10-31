import { config } from '@lanun/eslint-config/base'

export default [
	...config,
	// Test doubles are loose fakes of the Strapi/Directus contexts.
	{ files: ['**/*.test.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off' } },
	{ ignores: ['dev/**', 'plugins/strapi-exif-plugin/strapi-server.js'] },
]
