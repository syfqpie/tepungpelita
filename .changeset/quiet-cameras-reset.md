---
"@tepungpelita/directus-exif-extension": patch
---

Fix several import problems and make imports lighter.

- Photos with an `Orientation` tag no longer fail to import. `exifr` returned text such as "Rotate 270 CW" for a column that holds a number; tags are now kept numeric. As a result the `raw` JSON holds standard numeric EXIF codes (for example `Flash: 0`).
- WebP, GIF and other formats `exifr` cannot read are skipped quietly instead of being logged as errors.
- The stored `date_taken` no longer depends on the server's timezone: it is the camera's clock time, saved as UTC. Rows imported earlier on a server that was not on UTC keep their old value.
- Replacing an image with one that has no EXIF removes the old row, so it can't keep showing the previous photo's data (including its GPS).
- If setup stopped after creating the `exif_metadata` collection but before its relation to `directus_files`, the next start now creates the missing relation instead of skipping it.
- New installs get a wider `exposure_time` column, so fast shutter speeds such as 1/8000 s are no longer rounded. Existing installs keep their current column.
- Files are read by path instead of being loaded into memory first.
