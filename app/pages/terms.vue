<script setup lang="ts">
definePageMeta({})

const { terms } = useLegalContent()
const doc = computed(() => terms.value)

useSeoMeta({
  title: () => doc.value.title,
  description: () => doc.value.intro,
})
</script>

<template>
  <AppLegalDocument
    :title="doc.title"
    :updated="doc.updated"
    :intro="doc.intro"
    :sections="doc.sections"
  />
</template>
