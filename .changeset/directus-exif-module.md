---
'@tepungpelita/directus-exif-extension': minor
---

Add an **EXIF** module to the Directus admin to browse the stored EXIF data.

- An image list with thumbnails, camera, lens, date taken and exposure, newest first.
- A details drawer with the exposure readout, camera, lens, location, every stored tag (with a filter box), and a JSON download.
- Search by camera, lens or file name, and a folder filter that includes subfolders.
- An About page. The module is only shown to roles that can read `exif_metadata`.

Turn it on in Settings → Settings → Module Bar. The minimum supported Directus version is now 11, because the module uses the v11 theme variables.
