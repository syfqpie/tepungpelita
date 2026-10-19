<p align="center">
  <img src="./tepungpelita-logo.svg" alt="Pelita logo" width="160" />
</p>

<h1 align="center">@tepungpelita</h1>

<p align="center">
  A monorepo of <a href="https://directus.io">Directus</a> extensions.
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
pnpm docker:up          # start Directus at http://localhost:8055
```

Copy `dev/.env.example` to `dev/.env` and fill in the admin credentials before the first start.

## Development

Directus mounts `./extensions` directly, so anything built to `extensions/<name>/dist` is picked up when the container restarts.

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `pnpm build`          | Build all extensions                        |
| `pnpm dev`            | Watch-build all extensions in parallel      |
| `pnpm validate`       | Validate all extensions                     |
| `pnpm test`           | Run unit tests (Vitest)                             |
| `pnpm docker:up`      | Start the dev environment                   |
| `pnpm docker:down`    | Stop the dev environment                    |
| `pnpm docker:restart` | Restart Directus to load rebuilt extensions |
| `pnpm docker:logs`    | Follow Directus logs                        |

Typical loop:

```bash
pnpm build
pnpm docker:restart
```

### Resetting the dev environment

```bash
pnpm docker:down
rm -rf dev/database/*   # wipes the sqlite DB (collections, users, settings)
pnpm docker:up
```

Uploaded files live in `dev/uploads`.

### Git hooks

Commits must follow [Conventional Commits](https://www.conventionalcommits.org). If `pre-commit` is installed, `./scripts/init-dev.sh` sets up the hook. To install it manually:

```bash
pre-commit install --hook-type commit-msg
```

## Project structure

```
.
├── dev/                    # local Directus (docker-compose, .env, sqlite, uploads)
├── extensions/
│   └── exif-extension/     # @tepungpelita/directus-exif-extension
├── scripts/                # dev setup scripts
├── tepungpelita-logo.svg
├── package.json            # root: shared tooling only
└── pnpm-workspace.yaml
```

## Releasing

Versioning and publishing use [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset   # describe the change and pick a bump; commit the generated file
pnpm version-packages   # apply pending changesets (bumps versions, updates changelogs)
pnpm release     # build and publish to npm (requires `npm login` and the @tepungpelita org)
```

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
