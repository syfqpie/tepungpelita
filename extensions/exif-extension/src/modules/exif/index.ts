import { defineModule } from '@directus/extensions-sdk';
import ExifPage from './exif-page.vue';

export default defineModule({
	id: 'exif',
	name: 'EXIF',
	icon: 'photo_camera',
	// Hide the nav entry from roles that cannot read the collection.
	preRegisterCheck: (user, permissions) =>
		user.admin_access === true || permissions.some((permission) => permission.collection === 'exif_metadata' && permission.action === 'read'),
	routes: [{ path: '', component: ExifPage }],
});
