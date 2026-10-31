import { defineModule } from '@directus/extensions-sdk';
import ExifPage from './exif-page.vue';

export default defineModule({
	id: 'exif',
	name: 'EXIF',
	icon: 'photo_camera',
	routes: [{ path: '', component: ExifPage }],
});
