---
'@tepungpelita/directus-exif-extension': minor
---

Add an **EXIF** module to the Directus admin to browse the stored EXIF data.

- An **Images** page: thumbnail, file name and size, camera, lens, date taken and exposure, newest first.
- A details drawer with the exposure readout, camera, lens, location, every stored tag (with a filter box), and a JSON download.
- Search by camera, lens or file name, and a folder filter that includes subfolders.
- An **About** page. The module is only shown to roles that can read `exif_metadata`.

To upgrade:

- Turn the module on in Settings → Settings → Module Bar. Directus does not add new modules to a module bar you have already customized.
- Roles that use it need Read access to `exif_metadata`, `directus_files` and `directus_folders`.
- The minimum supported Directus version is now 11 (was 10.10), because the module uses the v11 theme variables.
- No migration is needed. The import hook is unchanged.
