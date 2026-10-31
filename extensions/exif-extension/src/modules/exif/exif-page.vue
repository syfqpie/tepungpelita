<template>
	<private-view title="EXIF">
		<div class="exif-page">{{ cameraName('Canon', 'Canon EOS 5D') }} · {{ formatShutter(0.005) }}</div>
	</private-view>
</template>

<script setup lang="ts">
import { cameraName, formatShutter } from '@tepungpelita/exif-ui-core';
</script>

<style scoped>
.exif-page {
	padding: var(--content-padding);
}
</style>
