import { defineModule } from '@directus/extensions-sdk';
import { canSeeModule } from './access';
import AboutPage from './about-page.vue';
import ExifPage from './exif-page.vue';

export default defineModule({
	id: 'exif',
	name: 'EXIF',
	icon: 'camera',
	// Hide the nav entry from roles that cannot read the collection.
	preRegisterCheck: canSeeModule,
	routes: [
		{ path: '', component: ExifPage },
		{ path: 'about', component: AboutPage },
	],
});
