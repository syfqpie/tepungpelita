<p align="center">
  <img src="https://raw.githubusercontent.com/syfqpie/tepungpelita/main/tepungpelita-logo.svg" alt="Pelita logo" width="120" />
</p>

<h1 align="center">@tepungpelita/directus-exif-extension</h1>

Directus bundle extension that extracts EXIF metadata from uploaded images and stores it in an `exif_metadata` collection, linked one-to-one with `directus_files`.

## How it works

The bundle contains a single hook, `exif-import` (`src/hooks/exif-import`):

1. **Provisioning** — on `app.after` it creates the `exif_metadata` collection and its relation to `directus_files` if they don't exist (definition in `schemas/exif-metadata.ts`).
2. **Import** — on `files.upload` it reads the uploaded image from disk, parses it with [`exifr`](https://github.com/MikeKovarik/exifr), and creates or updates the `exif_metadata` row for that file.

Only JPEG, PNG, TIFF, HEIC and AVIF images are read (`exifr` can't parse WebP or GIF); other files and images without EXIF data are skipped. Errors are logged and never block the upload.

## Collection: `exif_metadata`

| Field                                       | Type                                                     | Source EXIF tag                          |
| ------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `file`                                      | uuid (m2o → `directus_files`, unique, cascade on delete) | —                                        |
| `camera_make`, `camera_model`, `lens_model` | string                                                   | `Make`, `Model`, `LensModel`             |
| `date_taken`                                | timestamp                                                | `DateTimeOriginal` / `CreateDate`        |
| `orientation`                               | integer                                                  | `Orientation`                            |
| `iso`                                       | integer                                                  | `ISO`                                    |
| `focal_length`, `aperture`, `exposure_time` | decimal                                                  | `FocalLength`, `FNumber`, `ExposureTime` |
| `gps_latitude`, `gps_longitude`             | decimal                                                  | GPS (decimal degrees)                    |
| `gps_altitude`                              | decimal                                                  | `GPSAltitude`                            |
| `raw`                                       | json                                                     | Full parsed EXIF payload                 |

The collection is created automatically by the hook on startup; no migration is needed.

## Querying via the API

`exif_metadata` is a regular collection, so use the standard items endpoints. The authenticated role needs read permission on `exif_metadata`.

```bash
# EXIF for one file
curl -H "Authorization: Bearer $TOKEN" \
  "$DIRECTUS_URL/items/exif_metadata?filter[file][_eq]=<file-id>&limit=1"

# Photos taken with a given camera, newest first, with the related file info
curl -H "Authorization: Bearer $TOKEN" \
  "$DIRECTUS_URL/items/exif_metadata?filter[camera_make][_eq]=Canon&sort=-date_taken&fields=id,camera_model,date_taken,file.id,file.filename_download"

# Only photos that have GPS coordinates
curl -H "Authorization: Bearer $TOKEN" \
  "$DIRECTUS_URL/items/exif_metadata?filter[gps_latitude][_nnull]=true&fields=file,gps_latitude,gps_longitude"
```

With the SDK:

```ts
import { createDirectus, rest, readItems } from '@directus/sdk'

const client = createDirectus(DIRECTUS_URL).with(rest())
const items = await client.request(
  readItems('exif_metadata', { filter: { file: { _eq: fileId } }, limit: 1 }),
)
```

## Installation

Search for **Directus Exif Extension** in the Directus Marketplace (Settings → Marketplace), or install from npm:

```bash
npm install @tepungpelita/directus-exif-extension
```

This hook reads files from disk and uses Directus services, so it is not a sandboxed extension. On self-hosted instances, set `MARKETPLACE_TRUST=all` (or trust this package) to install it from the Marketplace.

## Requirements

- Directus `>=10.10.0`
- Files stored on the **local** storage driver (the default). The hook reads the file from the location's `STORAGE_<LOCATION>_ROOT` (default `./uploads`); files on other drivers are skipped with a warning.

## Development

From the repo root:

```bash
pnpm --filter @tepungpelita/directus-exif-extension build   # or: pnpm build
pnpm docker:restart:directus
```

Upload a JPEG with EXIF data in the Directus file library, then check the `exif_metadata` collection.
