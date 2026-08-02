<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

await navigateTo(`/tournaments/${slug}`)
</script>

<template>
  <div />
</template>
