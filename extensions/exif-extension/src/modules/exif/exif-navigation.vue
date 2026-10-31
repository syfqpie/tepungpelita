<template>
	<v-list nav>
		<v-list-item v-for="item in items" :key="item.to" :to="item.to" exact>
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content><v-text-overflow :text="item.name" /></v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
const items = [
	{ name: 'Photos', icon: 'photo_library', to: '/exif' },
	{ name: 'About', icon: 'info', to: '/exif/about' },
]
</script>
