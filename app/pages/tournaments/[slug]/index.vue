<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const { t } = useI18n()

const { data: tournament, error } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))
const { data: published } = await useAsyncData(`published-photos-${slug}`, () =>
  api.getPhotos(slug, { page: 1, limit: 18, published: true }),
)

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: t('tournaments.notFoundOne') })
}

const publishedPhotos = computed(() => published.value?.data ?? [])
</script>

<template>
  <div v-if="tournament">
    <AppPageHeader :title="t('tournaments.findMyPhotos')">
      <template #left>
        <NuxtLink to="/tournaments" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <SearchStepper :current="2" tournament-to="/tournaments" />

      <h2 class="text-xl font-bold">{{ t('search.findYourselfTitle') }}</h2>
      <p class="mt-2 text-sm text-gray-400">{{ t('search.findYourselfHint') }}</p>

      <div class="mt-4">
        <SearchModeTabs :slug="slug" mode="face" />
      </div>

      <TournamentCard :tournament="tournament" compact class="mb-4" />
      <div class="mb-4 flex justify-end">
        <NuxtLink to="/tournaments" class="inline-flex items-center gap-1 text-sm font-medium text-brand-400">
          <AppIcon name="pencil" class="h-3.5 w-3.5" />
          {{ t('search.changeTournament') }}
        </NuxtLink>
      </div>

      <div v-if="tournament.payouts_ready === false" class="mb-4">
        <AppAlert type="info" :message="t('cart.errorPayouts')" />
      </div>

      <NuxtLink :to="`/tournaments/${slug}/search/face`" class="search-card mb-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
          <AppIcon name="face" class="h-6 w-6" />
        </div>
        <div>
          <div class="font-semibold">{{ t('tournaments.searchByFace') }}</div>
          <div class="mt-1 text-xs text-gray-500">{{ t('tournaments.searchByFaceHint') }}</div>
        </div>
        <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
      </NuxtLink>

      <NuxtLink :to="`/tournaments/${slug}/search`" class="search-card">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-gray-300">
          <AppIcon name="user" class="h-6 w-6" />
        </div>
        <div>
          <div class="font-semibold">{{ t('tournaments.searchByName') }}</div>
          <div class="mt-1 text-xs text-gray-500">{{ t('tournaments.searchByNameHint') }}</div>
        </div>
        <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
      </NuxtLink>

      <section v-if="publishedPhotos.length" class="mt-8">
        <h2 class="mb-1 font-semibold">{{ t('tournaments.publishedTitle') }}</h2>
        <p class="mb-4 text-sm text-gray-500">{{ t('tournaments.publishedHint') }}</p>
        <PhotoGrid :photos="publishedPhotos" />
      </section>
    </div>
  </div>
</template>
