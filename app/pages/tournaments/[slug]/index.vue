<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const { t } = useI18n()

const { error } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('tournaments.notFoundOne') })
}

await navigateTo(`/tournaments/${slug}/search/face`, { replace: true })
</script>

<template>
  <div class="min-h-screen bg-page" />
</template>
