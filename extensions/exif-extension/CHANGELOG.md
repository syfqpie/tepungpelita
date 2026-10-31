# @tepungpelita/directus-exif-extension

## 0.2.0

### Minor Changes

- [#10](https://github.com/syfqpie/tepungpelita/pull/10) [`647f26b`](https://github.com/syfqpie/tepungpelita/commit/647f26bdf1ecddcdfc1fa2202eaf0f7ae160138c) Thanks [@syfqpie](https://github.com/syfqpie)! - Add an **EXIF** module to the Directus admin to browse the stored EXIF data.
  
  - An **Images** page: thumbnail, file name and size, camera, lens, date taken and exposure, newest first.
  - A details drawer with the exposure readout, camera, lens, location, every stored tag (with a filter box), and a JSON download.
  - Search by camera, lens or file name, and a folder filter that includes subfolders.
  - An **About** page. The module is only shown to roles that can read `exif_metadata`.
  
  To upgrade:
  
  - Turn the module on in Settings → Settings → Module Bar. Directus does not add new modules to a module bar you have already customized.
  - Roles that use it need Read access to `exif_metadata`, `directus_files` and `directus_folders`.
  - The minimum supported Directus version is now 11 (was 10.10), because the module uses the v11 theme variables.
  - No migration is needed. The import hook is unchanged.

## 0.1.2

### Patch Changes

- [#7](https://github.com/syfqpie/tepungpelita/pull/7) [`8e3ec08`](https://github.com/syfqpie/tepungpelita/commit/8e3ec08b234bf4e4ede34ca09a75ccc6abf0c9c4) Thanks [@syfqpie](https://github.com/syfqpie)! - Fix several import problems and make imports lighter.
  
  - Photos with an `Orientation` tag no longer fail to import. `exifr` returned text such as "Rotate 270 CW" for a column that holds a number; tags are now kept numeric. As a result the `raw` JSON holds standard numeric EXIF codes (for example `Flash: 0`).
  - WebP, GIF and other formats `exifr` cannot read are skipped quietly instead of being logged as errors.
  - The stored `date_taken` no longer depends on the server's timezone: it is the camera's clock time, saved as UTC. Rows imported earlier on a server that was not on UTC keep their old value.
  - Replacing an image with one that has no EXIF removes the old row, so it can't keep showing the previous photo's data (including its GPS).
  - If setup stopped after creating the `exif_metadata` collection but before its relation to `directus_files`, the next start now creates the missing relation instead of skipping it.
  - New installs get a wider `exposure_time` column, so fast shutter speeds such as 1/8000 s are no longer rounded. Existing installs keep their current column.
  - Files are read by path instead of being loaded into memory first.

## 0.1.1

### Patch Changes

- [#5](https://github.com/syfqpie/tepungpelita/pull/5) [`7ad4117`](https://github.com/syfqpie/tepungpelita/commit/7ad41177568db803fc20dfb4993e1f4549fec470) Thanks [@syfqpie](https://github.com/syfqpie)! - Widen the supported Directus range to `>=10.10.0`, use the `camera` icon and document Marketplace installation.

## 0.1.0

### Minor Changes

- [#1](https://github.com/syfqpie/tepungpelita/pull/1) [`8ac9fac`](https://github.com/syfqpie/tepungpelita/commit/8ac9faca9c7f5de4c7615aa86d840b10fe1e3b7a) Thanks [@syfqpie](https://github.com/syfqpie)! - Initial release: extract EXIF metadata from uploaded images into an `exif_metadata` collection.
