// Entry point for loading the plugin as a local plugin (dev app mounts it via `resolve`).
// When installed from npm, Strapi uses the `strapi-server` export in package.json instead.
module.exports = require('./dist/server')
