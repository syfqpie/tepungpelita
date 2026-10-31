<template>
	<private-view title="EXIF">
		<v-info v-if="forbidden" type="danger" icon="lock" title="No access">
			Your role needs read access to exif_metadata, directus_files and directus_folders.
		</v-info>
		<v-info v-else-if="error" type="danger" icon="error" title="Could not load EXIF data">{{ error }}</v-info>
		<v-info v-else-if="!loading && total === 0" icon="photo_camera" title="No photos with EXIF data yet">
			Upload JPEG images in the file library and their EXIF data appears here.
			<template #append>
				<v-button to="/files">Open file library</v-button>
			</template>
		</v-info>

		<div v-else class="exif-page">
			<v-table :headers="headers" :items="rows" item-key="id" :loading="loading" @click:row="({ item }) => (selected = item)">
				<template #[`item.thumb`]="{ item }">
					<img v-if="item.file" class="thumb" :src="thumbUrl(api, item)" :alt="item.file.name ?? ''" loading="lazy" />
				</template>
				<template #[`item.name`]="{ item }">{{ item.file?.name ?? item.file?.title }}</template>
				<template #[`item.camera`]="{ item }">{{ cameraName(item.cameraMake, item.cameraModel) }}</template>
				<template #[`item.taken`]="{ item }">{{ formatTaken(item.dateTaken) }}</template>
				<template #[`item.exposure`]="{ item }">{{ exposureLine(item) }}</template>
				<template #[`item.gps`]="{ item }">
					<v-icon v-if="item.gpsLatitude != null && item.gpsLongitude != null" name="location_on" small />
				</template>
			</v-table>

			<v-pagination v-if="pages > 1" v-model="page" class="pagination" :length="pages" :total-visible="5" />
		</div>

		<exif-drawer v-if="selected" :row="selected" @close="selected = null" />
	</private-view>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk'
import { cameraName, formatAperture, formatFocalLength, formatShutter, formatTaken } from '@tepungpelita/exif-ui-core'
import { computed, onMounted, ref, watch } from 'vue'
import ExifDrawer from './exif-drawer.vue'
import { fetchExifPage, PAGE_SIZE, thumbUrl } from './api'
import type { ExifRow } from './types'

const api = useApi()

const rows = ref<ExifRow[]>([])
const selected = ref<ExifRow | null>(null)
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const forbidden = ref(false)
const error = ref('')

const pages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const headers = [
	{ text: '', value: 'thumb', width: 80, sortable: false },
	{ text: 'File', value: 'name', width: 220, sortable: false },
	{ text: 'Camera', value: 'camera', width: 200, sortable: false },
	{ text: 'Taken', value: 'taken', width: 200, sortable: false },
	{ text: 'Exposure', value: 'exposure', width: 260, sortable: false },
	{ text: 'GPS', value: 'gps', width: 60, sortable: false },
]

const exposureLine = (row: ExifRow) =>
	[formatAperture(row.aperture), formatShutter(row.exposureTime), row.iso != null ? `ISO ${row.iso}` : '', formatFocalLength(row.focalLength)]
		.filter(Boolean)
		.join(' · ')

const load = async () => {
	loading.value = true
	error.value = ''

	try {
		;({ rows: rows.value, total: total.value } = await fetchExifPage(api, page.value))
	} catch (e: any) {
		if (e?.response?.status === 403) forbidden.value = true
		else error.value = e?.response?.data?.errors?.[0]?.message ?? e?.message ?? 'Unknown error'
	} finally {
		loading.value = false
	}
}

onMounted(load)
watch(page, load)
</script>

<style scoped>
.exif-page {
	padding: var(--content-padding);
	padding-top: 0;
}

.thumb {
	display: block;
	width: 48px;
	height: 48px;
	border-radius: var(--theme--border-radius);
	object-fit: cover;
}

.pagination {
	margin-top: 24px;
	justify-content: center;
}
</style>
