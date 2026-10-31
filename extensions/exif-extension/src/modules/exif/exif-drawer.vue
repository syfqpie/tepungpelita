<template>
	<v-drawer :model-value="true" :title="row.file?.name ?? '(file removed)'" icon="photo_camera" @cancel="emit('close')">
		<div class="body">
			<div v-if="row.file" class="photo">
				<img :src="appUrl(api, `assets/${row.file.id}?key=system-medium-contain`)" :alt="row.file.name ?? ''" />
			</div>

			<div class="toolbar">
				<template v-if="row.file">
					<a class="action" :href="appUrl(api, `assets/${row.file.id}`)" target="_blank" rel="noopener">
						<v-icon name="open_in_new" small /> Open image
					</a>
					<router-link class="action" :to="`/files/${row.file.id}`"><v-icon name="folder_open" small /> File library</router-link>
				</template>
				<button type="button" class="action" @click="download"><v-icon name="download" small /> Download JSON</button>
			</div>

			<dl class="strip">
				<div v-for="[label, value] in readout" :key="label">
					<dd>{{ value || '–' }}</dd>
					<dt>{{ label }}</dt>
				</div>
			</dl>

			<section>
				<h3>Camera</h3>
				<dl class="facts">
					<dt>Body</dt>
					<dd>{{ cameraName(row.cameraMake, row.cameraModel) || '–' }}</dd>
					<dt>Lens</dt>
					<dd>{{ row.lensModel ?? '–' }}</dd>
					<dt>Taken</dt>
					<dd>{{ formatTaken(row.dateTaken) || '–' }}</dd>
					<template v-if="meta">
						<dt>File</dt>
						<dd>{{ meta }}</dd>
					</template>
				</dl>
			</section>

			<section>
				<h3>Location</h3>
				<dl v-if="row.gpsLatitude != null && row.gpsLongitude != null" class="facts">
					<dt>Coordinates</dt>
					<dd>{{ formatGps(row.gpsLatitude, row.gpsLongitude) }}</dd>
					<template v-if="row.gpsAltitude != null">
						<dt>Altitude</dt>
						<dd>{{ Math.round(row.gpsAltitude) }} m</dd>
					</template>
					<dt>Map</dt>
					<dd><a :href="mapUrl(row.gpsLatitude, row.gpsLongitude)" target="_blank" rel="noopener">Open in OpenStreetMap</a></dd>
				</dl>
				<p v-else class="muted">This image has no GPS data.</p>
			</section>

			<section>
				<h3>All tags <span class="muted">{{ tags.length }}</span></h3>
				<v-input v-model="query" placeholder="Filter by tag or value">
					<template #prepend><v-icon name="search" /></template>
				</v-input>
				<p v-if="shown.length === 0" class="muted">{{ tags.length === 0 ? 'No tags stored.' : 'No tags match.' }}</p>
				<dl v-else class="facts tags">
					<template v-for="[name, value] in shown" :key="name">
						<dt>{{ name }}</dt>
						<dd>{{ value || '–' }}</dd>
					</template>
				</dl>
			</section>
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk'
import {
	cameraName,
	formatAperture,
	formatFocalLength,
	formatGps,
	formatShutter,
	formatSize,
	formatTaken,
	jsonFileName,
	mapUrl,
	saveFile,
	tagEntries,
} from '@tepungpelita/exif-ui-core'
import { computed, ref, watch } from 'vue'
import { appUrl } from './api'
import type { ExifRow } from './types'

const props = defineProps<{ row: ExifRow }>()
const emit = defineEmits<{ close: [] }>()

const api = useApi()
const query = ref('')

watch(() => props.row.id, () => (query.value = ''))

const meta = computed(() => {
	const file = props.row.file

	// Directus stores bytes; the shared formatter takes KB.
	return [file?.width && file?.height ? `${file.width} × ${file.height}` : '', formatSize(file?.size == null ? null : file.size / 1024), file?.type ?? '']
		.filter(Boolean)
		.join(' · ')
})

const readout = computed(() => [
	['Aperture', formatAperture(props.row.aperture)],
	['Shutter', formatShutter(props.row.exposureTime)],
	['ISO', props.row.iso == null ? '' : String(props.row.iso)],
	['Focal length', formatFocalLength(props.row.focalLength)],
])

const tags = computed(() => tagEntries(props.row.raw))

const shown = computed(() => {
	const needle = query.value.trim().toLowerCase()

	return needle ? tags.value.filter(([name, value]) => name.toLowerCase().includes(needle) || value.toLowerCase().includes(needle)) : tags.value
})

const download = () => saveFile(jsonFileName(props.row.file?.name), 'application/json', JSON.stringify(props.row, null, 2))
</script>

<style scoped>
.body {
	display: flex;
	flex-direction: column;
	gap: 28px;
	padding: 20px var(--content-padding) var(--content-padding);
}

.photo {
	display: grid;
	place-items: center;
	height: 320px;
	overflow: hidden;
	border-radius: var(--theme--border-radius);
	background: var(--theme--background-subdued);
}

.photo img {
	max-width: 100%;
	max-height: 100%;
}

.toolbar {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: -12px;
}

.action {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	background: transparent;
	color: var(--theme--foreground);
	font: inherit;
	font-size: 14px;
	text-decoration: none;
	cursor: pointer;
}

.action:hover {
	border-color: var(--theme--primary);
	color: var(--theme--primary);
}

.action:focus-visible,
a:focus-visible {
	outline: 2px solid var(--theme--primary);
	outline-offset: 2px;
}

/* The one loud element: the exposure triangle plus ISO, set like a camera's data readout. */
.strip {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
	margin: 0;
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: var(--theme--border-radius);
	font-variant-numeric: tabular-nums;
}

.strip div {
	display: flex;
	flex-direction: column-reverse;
	gap: 4px;
	padding: 16px;
	border-right: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.strip div:last-child {
	border-right: 0;
}

.strip dd {
	margin: 0;
	font-size: 26px;
	font-weight: 600;
	line-height: 1.1;
	white-space: nowrap;
	color: var(--theme--foreground-accent);
}

.strip dt {
	color: var(--theme--foreground-subdued);
	font-size: 13px;
}

section {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

h3 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
}

.muted {
	margin: 0;
	color: var(--theme--foreground-subdued);
	font-weight: 400;
}

.facts {
	display: grid;
	grid-template-columns: minmax(96px, 30%) 1fr;
	margin: 0;
}

.facts dt,
.facts dd {
	margin: 0;
	padding: 8px 0;
	border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
	overflow: visible;
	overflow-wrap: anywhere;
	text-overflow: clip;
	white-space: normal;
}

.facts dt {
	padding-right: 16px;
	color: var(--theme--foreground-subdued);
}

.facts dd {
	color: var(--theme--foreground);
}

.tags {
	max-height: 420px;
	overflow-y: auto;
}

a {
	color: var(--theme--primary);
}
</style>
