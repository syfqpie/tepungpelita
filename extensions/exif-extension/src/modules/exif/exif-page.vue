<template>
	<private-view title="EXIF">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="photo_camera" />
			</v-button>
		</template>

		<template #navigation><exif-navigation /></template>

		<v-info v-if="forbidden" type="danger" icon="lock" title="No access">
			Your role needs read access to exif_metadata, directus_files and directus_folders.
		</v-info>
		<v-info v-else-if="error" type="danger" icon="error" title="Could not load EXIF data">{{ error }}</v-info>

		<div v-else class="exif-page">
			<div v-if="total > 0 || filtering" class="filters">
				<v-input v-model="search" placeholder="Search camera, lens or file name">
					<template #prepend><v-icon name="search" /></template>
				</v-input>
				<v-select v-model="folder" :items="folderItems" show-deselect placeholder="All folders" />
				<div class="tail">
					<v-button v-if="filtering" secondary @click="clearFilters">Clear filters</v-button>
					<span class="count">{{ total }} {{ total === 1 ? 'photo' : 'photos' }}</span>
				</div>
			</div>

			<v-info v-if="!loading && total === 0 && !filtering" icon="photo_camera" title="No photos with EXIF data yet">
				Upload JPEG images in the file library and their EXIF data appears here.
				<template #append>
					<v-button to="/files">Open file library</v-button>
				</template>
			</v-info>
			<v-info v-else-if="!loading && total === 0" icon="search_off" title="No photos match these filters">
				Try a different search or choose another folder.
			</v-info>
			<template v-else>
				<ul class="list" :class="{ loading }">
					<li v-for="row in rows" :key="row.id">
						<button type="button" class="row" @click="selected = row">
							<span class="thumb">
								<img v-if="row.file" :src="thumbUrl(api, row)" alt="" loading="lazy" />
							</span>

							<span class="cell file">
								<span class="primary">{{ row.file?.name ?? row.file?.title ?? '(file removed)' }}</span>
								<span class="secondary">{{ fileMeta(row) }}</span>
							</span>

							<span class="cell camera">
								<span class="primary">{{ cameraName(row.cameraMake, row.cameraModel) || '–' }}</span>
								<span class="secondary">{{ row.lensModel }}</span>
							</span>

							<span class="cell taken">
								<span class="primary">{{ formatTaken(row.dateTaken, { time: false }) || '–' }}</span>
								<span class="secondary">{{ formatTakenTime(row.dateTaken) }}</span>
							</span>

							<span class="cell exposure">
								<span class="primary">
									<span v-if="row.aperture != null">{{ formatAperture(row.aperture) }}</span>
									<span v-if="row.exposureTime != null">{{ formatShutter(row.exposureTime) }}</span>
								</span>
								<span class="secondary">
									<span v-if="row.iso != null">ISO {{ row.iso }}</span>
									<span v-if="row.focalLength != null">{{ formatFocalLength(row.focalLength) }}</span>
								</span>
							</span>

							<v-icon
								v-if="row.gpsLatitude != null && row.gpsLongitude != null"
								class="gps"
								name="location_on"
								small
								title="Has GPS location"
							/>
						</button>
					</li>
				</ul>

				<v-pagination v-if="pages > 1" v-model="page" class="pagination" :length="pages" :total-visible="5" />
			</template>
		</div>

		<exif-drawer v-if="selected" :row="selected" @close="selected = null" />
	</private-view>
</template>

<script setup lang="ts">
import { useApi } from '@directus/extensions-sdk'
import {
	cameraName,
	formatAperture,
	formatFocalLength,
	formatShutter,
	formatSize,
	formatTaken,
	formatTakenTime,
} from '@tepungpelita/exif-ui-core'
import { computed, onMounted, ref, watch } from 'vue'
import ExifDrawer from './exif-drawer.vue'
import ExifNavigation from './exif-navigation.vue'
import { fetchExifPage, fetchFolders, PAGE_SIZE, thumbUrl } from './api'
import { buildFilter, hasFilters } from './filter'
import { type Folder, folderOptions, withDescendants } from './folders'
import type { ExifRow } from './types'

const api = useApi()

const rows = ref<ExifRow[]>([])
const selected = ref<ExifRow | null>(null)
const total = ref(0)
const page = ref(1)
const loading = ref(true)
const search = ref('')
const appliedSearch = ref('')
const folder = ref<string | null>(null)
const folders = ref<Folder[]>([])
const forbidden = ref(false)
const error = ref('')

const folderItems = computed(() => folderOptions(folders.value))
const filtering = computed(() => hasFilters({ search: appliedSearch.value, folder: folder.value }))
const pages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

/** "4000 × 6000 · 8.2 MB"; Directus stores bytes, the shared formatter takes KB. */
const fileMeta = ({ file }: ExifRow) =>
	[file?.width && file?.height ? `${file.width} × ${file.height}` : '', formatSize(file?.size == null ? null : file.size / 1024)]
		.filter(Boolean)
		.join(' · ')

let latest = 0

const load = async () => {
	const request = ++latest

	loading.value = true
	error.value = ''

	try {
		const filter = buildFilter(appliedSearch.value, folder.value ? withDescendants(folders.value, folder.value) : null)
		const result = await fetchExifPage(api, page.value, filter)

		// A newer request (quick filter changes) owns the screen.
		if (request === latest) ({ rows: rows.value, total: total.value } = result)
	} catch (e: any) {
		if (request !== latest) return
		if (e?.response?.status === 403) forbidden.value = true
		else error.value = e?.response?.data?.errors?.[0]?.message ?? e?.message ?? 'Unknown error'
	} finally {
		if (request === latest) loading.value = false
	}
}

const clearFilters = () => {
	search.value = ''
	appliedSearch.value = ''
	folder.value = null
}

let timer: ReturnType<typeof setTimeout>

watch(search, (value) => {
	clearTimeout(timer)
	timer = setTimeout(() => (appliedSearch.value = value), 300)
})

// A new filter starts from page 1; the page watcher then does the load.
watch([appliedSearch, folder], () => (page.value === 1 ? load() : (page.value = 1)))
watch(page, load)

onMounted(async () => {
	// Folders are only needed for the filter; a failure just leaves the picker empty.
	folders.value = await fetchFolders(api).catch(() => [])
	await load()
})
</script>

<style scoped>
.header-icon {
	--v-button-background-color-disabled: var(--theme--background-normal);
	--v-button-color-disabled: var(--theme--foreground-subdued);
}

.exif-page {
	padding: var(--content-padding);
	padding-top: 20px;
}

.filters {
	display: grid;
	grid-template-columns: minmax(200px, 360px) minmax(160px, 240px) 1fr;
	align-items: center;
	gap: 12px;
	margin-bottom: 20px;
}

.tail {
	display: flex;
	align-items: center;
	gap: 12px;
}

.count {
	margin-left: auto;
	color: var(--theme--foreground-subdued);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

@media (max-width: 900px) {
	.filters {
		grid-template-columns: 1fr 1fr;
	}

	.tail {
		grid-column: 1 / -1;
	}
}

.list {
	container-type: inline-size;
	margin: 0;
	padding: 0;
	list-style: none;
	border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
	transition: opacity 120ms;
}

.list.loading {
	opacity: 0.5;
}

.list li {
	border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.row {
	display: grid;
	grid-template-columns: 64px minmax(0, 1.3fr) minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 1fr) 24px;
	align-items: center;
	gap: 16px;
	width: 100%;
	padding: 10px 12px;
	border: 0;
	border-radius: var(--theme--border-radius);
	background: transparent;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
}

.row:hover {
	background: var(--theme--background-subdued);
}

.row:focus-visible {
	outline: 2px solid var(--theme--primary);
	outline-offset: -2px;
}

.thumb {
	width: 64px;
	height: 64px;
	overflow: hidden;
	border-radius: var(--theme--border-radius);
	background: var(--theme--background-normal);
}

.thumb img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.cell {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.primary,
.secondary {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
}

.exposure .primary,
.exposure .secondary {
	display: flex;
	gap: 12px;
}

.primary {
	font-weight: 600;
}

.secondary {
	color: var(--theme--foreground-subdued);
	font-size: 13px;
}

.gps {
	color: var(--theme--foreground-subdued);
}

/* The list shares its row with the sidebar, so it is often narrow: stack instead of clipping. */
@container (max-width: 720px) {
	.row {
		grid-template-columns: 64px minmax(0, 1fr) minmax(0, 1fr) 24px;
	}

	.taken {
		display: none;
	}

	.file {
		grid-column: 2 / 3;
	}
}

@container (max-width: 520px) {
	.row {
		grid-template-columns: 64px minmax(0, 1fr) 24px;
	}

	.camera {
		display: none;
	}
}

.pagination {
	margin-top: 24px;
	justify-content: center;
}
</style>
