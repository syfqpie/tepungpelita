import { buildAbout } from '@tepungpelita/exif-ui-core'

import pkg from '../../package.json'

export default buildAbout({ ...pkg, title: pkg.strapi?.displayName })
