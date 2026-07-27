# @koci

Directus extensions.

## Structure

```
.
├── dev
│   └── directus
│       ├── database/               # sqlite data (gitignored)
│       └── uploads/                # local file storage (gitignored)
├── extensions
│   ├── exif-extension
│   │   └── ...
│   └── ...                         # future @koci/* extensions land here
├── package.json                    # root — shared tooling only
├── pnpm-workspace.yaml
└── README.md
```


## Prerequisites

- Node >= 22
- pnpm >= 10 (`corepack enable` will pick up the version pinned in `package.json`)
- Docker + Docker Compose


## Development

### Getting started

```bash
./scripts/init-dev.sh # creates local dev directories, install dependencies, and installs Git hooks (if available)

pnpm docker:up        # start development env
```

### Git hooks

If `pre-commit` is installed, `./scripts/init-dev.sh` automatically installs the required Git hooks.

To install them manually:

```bash
pre-commit install --hook-type commit-msg
```

### Development workflow

Directus mounts `./extensions` directly, so anything built to
`extensions/<name>/dist` is picked up on container (re)start.

After making changes to an extension:

```bash
pnpm build
pnpm docker:restart
```

For active development, run the SDK watch mode across all extensions in parallel and restart Directus as needed:

```bash
pnpm dev
```

## Adding a new extension

```bash
cd extensions
pnpm dlx create-directus-extension@latest
```

Name it `@koci/<name>-extension` in the generated `package.json`
(see `extensions/directus-exif-extension/package.json` for the convention),
then from the repo root:

```bash
pnpm install   # links it into the workspace
```

No changes to `pnpm-workspace.yaml` are needed — it already globs
`extensions/*`.

## Conventions

- **Naming**: package name `@koci/directus-<feature>-extension`, folder name
  matches the unscoped part (`directus-<feature>-extension`) so paths stay
  predictable under `extensions/`.
- **Shared TS config**: extend `tsconfig.base.json` from the repo root rather
  than duplicating compiler options per extension.
- **Extension-local deps**: runtime dependencies (e.g. `exifr`) belong in the
  extension's own `package.json`, not the root — the root only holds tooling
  shared by every extension (`@directus/extensions-sdk`, `typescript`).
- **Lockfile**: single `pnpm-lock.yaml` at the repo root. Extensions should
  not carry their own lockfiles.

## Extensions in this repo

| Package | Type | Purpose |
|---|---|---|
| [`@koci/directus-exif-extension`](./extensions/directus-exif-extension) | hook | Parses EXIF metadata from uploaded images and stores it on `directus_files`. |
