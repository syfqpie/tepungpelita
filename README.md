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

- Node >= 18
- pnpm >= 9 (`corepack enable` will pick up the version pinned in `package.json`)
- Docker + Docker Compose


### Development

### Git hooks

```bash
# install pre-commit if you don't have it
pre-commit install --hook-type commit-msg
```

## Getting started

```bash
pnpm install        # installs deps for every extension in one pass
pnpm build           # builds every extension (pnpm -r --if-present build)
pnpm docker:up        # starts Directus + sqlite via docker compose
```

Directus mounts `./extensions` directly, so anything built to
`extensions/<name>/dist` is picked up on container (re)start:

```bash
pnpm build
pnpm docker:restart
```

For active development, run the SDK's watch mode across all extensions in
parallel and restart Directus as needed:

```bash
pnpm dev
```

## Adding a new extension

```bash
cd extensions
pnpm dlx create-directus-extension@latest
```

Name it `@koci/directus-<name>-extension` in the generated `package.json`
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
