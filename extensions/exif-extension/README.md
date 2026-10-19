<p align="center">
  <img src="../../koci-logo.svg" alt="Koci logo" width="120" />
</p>

<h1 align="center">@koci/directus-exif-extension</h1>

Directus bundle extension that extracts EXIF metadata from uploaded images and stores it in an `exif_metadata` collection, linked one-to-one with `directus_files`.

## How it works

The bundle contains a single hook, `exif-import` (`src/hooks/exif-import`):

1. **Provisioning** — on `app.after` it creates the `exif_metadata` collection and its relation to `directus_files` if they don't exist (definition in `schemas/exif-metadata.ts`).
2. **Import** — on `files.upload` it reads the uploaded image from disk, parses it with [`exifr`](https://github.com/MikeKovarik/exifr), and creates or updates the `exif_metadata` row for that file.

Non-image files and images without EXIF data are skipped. Errors are logged and never block the upload.

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

The same schema is also created by the migration in `extensions/migrations/`. Keep field names in sync between the two.

## Requirements

- Directus `^10.10.0`
- Files stored on the **local** storage driver. The hook reads the file from `STORAGE_LOCAL_ROOT` (default `./uploads`), so other storage drivers are not supported.

## Development

From the repo root:

```bash
pnpm --filter @koci/directus-exif-extension build   # or: pnpm build
pnpm docker:restart
```

Upload a JPEG with EXIF data in the Directus file library, then check the `exif_metadata` collection.
