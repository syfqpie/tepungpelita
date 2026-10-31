import { Images } from '@strapi/icons'
import type { StrapiApp } from '@strapi/strapi/admin'

const PLUGIN_ID = 'exif'

export default {
	register(app: StrapiApp) {
		app.addMenuLink({
			to: `plugins/${PLUGIN_ID}`,
			icon: Images,
			intlLabel: { id: `${PLUGIN_ID}.plugin.name`, defaultMessage: 'EXIF' },
			Component: () => import('./pages/ExifPage'),
			// No permission gate: Strapi deletes permissions for collections that weren't loaded at boot, so in dev a
			// restart during a rebuild made the link vanish. The page's API calls enforce read access instead.
			permissions: [],
		})

		app.registerPlugin({ id: PLUGIN_ID, name: PLUGIN_ID })
	},
}
