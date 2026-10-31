<h1 align="center">@tepungpelita/strapi-exif-plugin</h1>

Strapi 5 plugin that extracts EXIF metadata from uploaded images and stores it in an `exif-metadata` collection, linked one-to-one with the media library file.

## How it works

On every media upload the plugin reads the image from disk, parses it with [`exifr`](https://github.com/MikeKovarik/exifr), and creates or updates one `exif-metadata` entry for that file. Only JPEG, PNG, TIFF, HEIC and AVIF images are read (`exifr` can't parse WebP or GIF); other files and images without EXIF data are skipped. Replacing a file refreshes its entry. Errors are logged and never block the upload. Deleting a file removes its entry.

## Collection: `exif-metadata`

UID: `plugin::exif.exif-metadata`. API ID: `exif-metadatas`.

| Field                                         | Type     | Source EXIF tag                          |
| --------------------------------------------- | -------- | ---------------------------------------- |
| `file`                                        | relation | one-to-one → `plugin::upload.file`       |
| `cameraMake`, `cameraModel`, `lensModel`      | string   | `Make`, `Model`, `LensModel`             |
| `dateTaken`                                   | datetime | `DateTimeOriginal` / `CreateDate`        |
| `orientation`, `iso`                          | integer  | `Orientation`, `ISO`                     |
| `focalLength`, `aperture`, `exposureTime`     | float    | `FocalLength`, `FNumber`, `ExposureTime` |
| `gpsLatitude`, `gpsLongitude`, `gpsAltitude`  | float    | GPS (decimal degrees)                    |
| `raw`                                         | json     | Full parsed EXIF payload                 |

## Installation

```bash
npm install @tepungpelita/strapi-exif-plugin
```

Strapi picks the plugin up automatically. Restart Strapi after installing.

## Requirements

- Strapi `^5`
- Files stored with the **local** upload provider (the default). Files on other providers are skipped with a warning.

## Querying via the API

Entries are not exposed over REST by default. Enable the `find` and `findOne` permissions for `Exif-metadata` under **Settings → Users & Permissions → Roles**, or use an API token.

```bash
# EXIF for one file
curl -H "Authorization: Bearer $TOKEN" \
  "$STRAPI_URL/api/exif-metadatas?filters[file][id][$eq]=<file-id>&populate=file"

# Photos taken with a given camera, newest first
curl -H "Authorization: Bearer $TOKEN" \
  "$STRAPI_URL/api/exif-metadatas?filters[cameraMake][$eq]=Canon&sort=dateTaken:desc&populate=file"
```

## Development

From the repo root, with the Strapi dev app running (`pnpm docker:up:strapi`):

```bash
pnpm --filter @tepungpelita/strapi-exif-plugin build
pnpm docker:restart:strapi
```
