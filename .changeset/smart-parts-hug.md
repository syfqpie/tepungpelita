---
"@tepungpelita/strapi-exif-plugin": minor
---

First release of the Strapi 5 plugin. It reads the EXIF metadata of uploaded images and stores it in a hidden `exif-metadata` collection linked to the media file, and adds an **EXIF** page to the admin.

- Reads the original image before Strapi's size optimization re-encodes it (which drops EXIF), so metadata survives the default settings. Replacing a file refreshes its entry, and deleting it removes the entry.
- The EXIF page lists photos with thumbnails, camera, date and exposure; a details panel shows the readout, camera, lens, GPS, every stored tag (with a filter), links to the image and its Media Library entry, and a per-image JSON download.
- Search by file name, camera make, model or lens, and filter by Media Library folder (including subfolders). Export the matching photos as CSV.
- Access follows the Media Library read permission through the plugin's own admin routes (`GET /exif/images`, `GET /exif/folders`).
- Reads JPEG, PNG, TIFF, HEIC and AVIF. Capture time is stored as the camera's clock, so it is the same on any server.
