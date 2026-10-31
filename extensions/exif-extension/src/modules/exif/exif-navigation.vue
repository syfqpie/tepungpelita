<template>
	<v-list nav>
		<v-list-item v-for="item in Object.values(NAV)" :key="item.to" :to="item.to" exact>
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content><v-text-overflow :text="item.name" /></v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import { NAV } from './nav'
</script>
