<template>
	<v-drawer :model-value="true" :title="row.file?.name ?? '(file removed)'" icon="photo_camera" @cancel="emit('close')">
		<div class="body">
			<p v-if="meta" class="meta">{{ meta }}</p>

			<img v-if="row.file" class="photo" :src="appUrl(api, `assets/${row.file.id}?key=system-medium-contain`)" :alt="row.file.name ?? ''" />

			<div v-if="row.file" class="links">
				<a :href="appUrl(api, `assets/${row.file.id}`)" target="_blank" rel="noopener">Open image</a>
				<router-link :to="`/files/${row.file.id}`">Open in file library</router-link>
			</div>

			<v-button secondary small @click="download">Download JSON</v-button>

			<dl class="readout">
				<div v-for="[label, value] in readout" :key="label">
					<dt>{{ label }}</dt>
					<dd>{{ value || '–' }}</dd>
				</div>
			</dl>

			<h3>Camera</h3>
			<dl class="facts">
				<dt>Body</dt>
				<dd>{{ cameraName(row.cameraMake, row.cameraModel) || '–' }}</dd>
				<dt>Lens</dt>
				<dd>{{ row.lensModel ?? '–' }}</dd>
				<dt>Taken</dt>
				<dd>{{ formatTaken(row.dateTaken) || '–' }}</dd>
			</dl>

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
			<p v-else class="muted">This photo has no GPS data.</p>

			<h3>All tags ({{ tags.length }})</h3>
			<v-input v-model="query" placeholder="Filter by tag or value" />
			<p v-if="shown.length === 0" class="muted">{{ tags.length === 0 ? 'No tags stored.' : 'No tags match.' }}</p>
			<dl v-else class="facts">
				<template v-for="[name, value] in shown" :key="name">
					<dt>{{ name }}</dt>
					<dd>{{ value || '–' }}</dd>
				</template>
			</dl>
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
	align-items: flex-start;
	gap: 16px;
	padding: var(--content-padding);
	padding-top: 0;
}

.meta,
.muted {
	margin: 0;
	color: var(--theme--foreground-subdued);
}

h3 {
	margin: 8px 0 0;
	font-size: 16px;
}

.photo {
	display: block;
	width: 100%;
	max-height: 320px;
	object-fit: contain;
	background: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
}

.links {
	display: flex;
	flex-wrap: wrap;
	gap: 16px;
}

a {
	color: var(--theme--primary);
}

.readout {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px 24px;
	width: 100%;
	margin: 0;
	font-variant-numeric: tabular-nums;
}

.readout dt {
	color: var(--theme--foreground-subdued);
}

.readout dd {
	margin: 0;
	font-size: 22px;
	font-weight: 600;
	white-space: nowrap;
}

.facts {
	display: grid;
	grid-template-columns: minmax(100px, 35%) 1fr;
	gap: 8px 16px;
	width: 100%;
	margin: 0;
}

.facts dt {
	color: var(--theme--foreground-subdued);
	overflow-wrap: anywhere;
}

.facts dd {
	margin: 0;
	overflow-wrap: anywhere;
}
</style>
