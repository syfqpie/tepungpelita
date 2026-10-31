import type { Plugin } from '@strapi/strapi'

import images from './images'

// Annotated because the inferred type can't be named portably under pnpm (TS2742).
const controllers: Plugin.LoadedPlugin['controllers'] = { images }

export default controllers
