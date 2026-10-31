import type { Plugin } from '@strapi/strapi'

import bootstrap from './bootstrap'
import contentTypes from './content-types'
import controllers from './controllers'
import routes from './routes'

// Annotated because the inferred `bootstrap` type can't be named portably under pnpm (TS2742).
const plugin: {
	bootstrap: Plugin.LoadedPlugin['bootstrap']
	contentTypes: typeof contentTypes
	controllers: Plugin.LoadedPlugin['controllers']
	routes: typeof routes
} = {
	bootstrap,
	contentTypes,
	controllers,
	routes,
}

export default plugin
