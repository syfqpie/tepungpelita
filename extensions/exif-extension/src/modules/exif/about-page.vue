<template>
	<private-view title="About">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="info" />
			</v-button>
		</template>

		<template #navigation><exif-navigation /></template>

		<div class="about">
			<h2>{{ about.title }}</h2>
			<p v-if="about.description" class="description">{{ about.description }}</p>

			<dl class="facts">
				<dt>Version</dt>
				<dd>{{ about.version }}</dd>
				<template v-if="about.author">
					<dt>Created by</dt>
					<dd>{{ about.author }}</dd>
				</template>
				<template v-if="about.repoHref">
					<dt>Repository</dt>
					<dd><a :href="about.repoHref" target="_blank" rel="noopener">{{ about.repoLabel || 'View source' }}</a></dd>
				</template>
				<dt>Access</dt>
				<dd>Roles need read access to exif_metadata, directus_files and directus_folders.</dd>
			</dl>
		</div>
	</private-view>
</template>

<script setup lang="ts">
import { buildAbout } from '@tepungpelita/exif-ui-core'
import ExifNavigation from './exif-navigation.vue'
import pkg from '../../../package.json'

const about = buildAbout(pkg)
</script>

<style scoped>
.header-icon {
	--v-button-background-color-disabled: var(--theme--background-normal);
	--v-button-color-disabled: var(--theme--foreground-subdued);
}

.about {
	max-width: 640px;
	color: var(--theme--foreground);
	padding: 20px var(--content-padding) var(--content-padding);
}

h2 {
	margin: 0 0 8px;
	color: var(--theme--foreground-accent);
	font-size: 24px;
	font-weight: 600;
}

.description {
	margin: 0 0 28px;
	color: var(--theme--foreground-subdued);
}

.facts {
	display: grid;
	grid-template-columns: minmax(110px, 30%) 1fr;
	margin: 0;
}

.facts dt,
.facts dd {
	margin: 0;
	padding: 10px 0;
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

a {
	color: var(--theme--primary);
}

a:focus-visible {
	outline: 2px solid var(--theme--primary);
	outline-offset: 2px;
}
</style>
