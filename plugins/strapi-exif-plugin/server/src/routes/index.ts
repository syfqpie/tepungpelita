export default {
	admin: {
		type: 'admin',
		routes: [
			{
				method: 'GET',
				path: '/images',
				handler: 'images.find',
				config: {
					// Same rule as the Media Library itself. The EXIF collection's own Content Manager permissions can't be
					// used: Strapi deletes them whenever a boot interrupts its permission sync, which hot reload can cause.
					policies: ['admin::isAuthenticatedAdmin', { name: 'admin::hasPermissions', config: { actions: ['plugin::upload.read'] } }],
				},
			},
		],
	},
}
