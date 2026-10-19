<p align="center">
  <img src="./tepungpelita-logo.svg" alt="Pelita logo" width="160" />
</p>

<h1 align="center">@tepungpelita</h1>

<p align="center">
  A monorepo of extensions and plugins for headless CMSes, starting with <a href="https://directus.io">Directus</a>.
</p>

## Extensions

| Package                                                        | Type | Purpose                                                                                    |
| -------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------ |
| [`@tepungpelita/directus-exif-extension`](./extensions/exif-extension) | hook | Parses EXIF metadata from uploaded images and stores it in the `exif_metadata` collection. |

## Prerequisites

- Node >= 22
- pnpm >= 12 (`corepack enable` picks up the version pinned in `package.json`)
- Docker + Docker Compose

## Getting started

```bash
./scripts/init-dev.sh   # creates local dev directories, installs dependencies and Git hooks (if available)
pnpm docker:up:directus # start Directus at http://localhost:8055
pnpm docker:up:strapi   # start Strapi at http://localhost:1337 (optional)
```

Copy `dev/directus/.env.example` to `dev/directus/.env` and fill in the admin credentials before the first start. `init-dev.sh` also creates `dev/strapi/.env` with generated secrets.

## Development

Directus mounts `./extensions` directly, so anything built to `extensions/<name>/dist` is picked up when the container restarts.

| Command                        | Description                                  |
| ------------------------------ | -------------------------------------------- |
| `pnpm build`                   | Build all extensions                         |
| `pnpm dev`                     | Watch-build all extensions in parallel       |
| `pnpm validate`                | Validate all extensions                      |
| `pnpm test`                    | Run unit tests (Vitest)                      |
| `pnpm docker:up:directus`      | Start the Directus dev environment           |
| `pnpm docker:down:directus`    | Stop the Directus dev environment            |
| `pnpm docker:restart:directus` | Restart Directus to load rebuilt extensions  |
| `pnpm docker:logs:directus`    | Follow Directus logs                         |
| `pnpm docker:up:strapi`        | Start the Strapi dev environment             |
| `pnpm docker:down:strapi`      | Stop the Strapi dev environment              |
| `pnpm docker:restart:strapi`   | Restart Strapi                               |
| `pnpm docker:logs:strapi`      | Follow Strapi logs                           |

`dev/strapi` is a standalone npm app run only in Docker (it has its own `package-lock.json`). It is not part of the pnpm workspace, so `pnpm build` and CI don't touch it.

Typical loop:

```bash
pnpm build
pnpm docker:restart:directus
```

### Resetting the dev environment

```bash
pnpm docker:down:directus
rm -rf dev/directus/database/*   # wipes the sqlite DB (collections, users, settings)
pnpm docker:up:directus
```

Uploaded files live in `dev/directus/uploads`.

### Git hooks

Commits must follow [Conventional Commits](https://www.conventionalcommits.org). If `pre-commit` is installed, `./scripts/init-dev.sh` sets up the hook. To install it manually:

```bash
pre-commit install --hook-type commit-msg
```

## Project structure

```
.
├── dev/
│   ├── directus/           # local Directus (docker-compose, .env, sqlite, uploads)
│   └── strapi/             # local Strapi app (Docker, npm, standalone)
├── extensions/
│   └── exif-extension/     # @tepungpelita/directus-exif-extension
├── scripts/                # dev setup scripts
├── tepungpelita-logo.svg
├── package.json            # root: shared tooling only
└── pnpm-workspace.yaml
```

## Releasing

Versioning and publishing use [Changesets](https://github.com/changesets/changesets) and run in CI, so you don't publish by hand:

1. Run `pnpm changeset` and commit the generated file with your change. PRs that change a package without a changeset fail CI.
2. When the PR is merged to `main`, the Release workflow opens (or updates) a "chore: version packages" PR.
3. Merging that PR publishes to npm through [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC), with no `NPM_TOKEN`. Each package needs a trusted publisher entry on npm (repo `syfqpie/tepungpelita`, workflow `release.yml`), and a brand-new package needs one manual first publish.

## Adding a new extension

```bash
cd extensions
pnpm dlx create-directus-extension@latest
```

Name it `@tepungpelita/directus-<feature>-extension` in the generated `package.json`, then from the repo root:

```bash
pnpm install   # links it into the workspace
```

No changes to `pnpm-workspace.yaml` are needed; it already globs `extensions/*`.

## Conventions

- **Naming**: package name `@tepungpelita/directus-<feature>-extension`. Folders under `extensions/` are named `<feature>-extension`.
- **Dependencies**: runtime dependencies (e.g. `exifr`) belong in the extension's own `package.json`. The root only holds shared tooling.
- **Lockfile**: a single `pnpm-lock.yaml` at the repo root. Extensions don't carry their own.
