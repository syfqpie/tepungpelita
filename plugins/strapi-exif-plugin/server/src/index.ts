import type { Plugin } from '@strapi/strapi'

import bootstrap from './bootstrap'
import contentTypes from './content-types'

// Annotated because the inferred `bootstrap` type can't be named portably under pnpm (TS2742).
const plugin: { bootstrap: Plugin.LoadedPlugin['bootstrap']; contentTypes: typeof contentTypes } = {
	bootstrap,
	contentTypes,
}

export default plugin
