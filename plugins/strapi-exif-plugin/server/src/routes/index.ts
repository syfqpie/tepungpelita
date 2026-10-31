// Same rule as the Media Library itself. The EXIF collection's own Content Manager permissions can't be used:
// Strapi deletes them whenever a boot interrupts its permission sync, which hot reload can cause.
const policies = ['admin::isAuthenticatedAdmin', { name: 'admin::hasPermissions', config: { actions: ['plugin::upload.read'] } }]

export default {
	admin: {
		type: 'admin',
		routes: [
			{ method: 'GET', path: '/images', handler: 'images.find', config: { policies } },
			{ method: 'GET', path: '/folders', handler: 'images.folders', config: { policies } },
		],
	},
}
