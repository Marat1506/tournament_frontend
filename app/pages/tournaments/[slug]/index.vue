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

      <p class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('tournaments.selectedLabel') }}</p>
      <TournamentCard :tournament="tournament" compact class="mb-3" />
      <div v-if="tournament.payouts_ready === false" class="mb-4">
        <AppAlert type="info" :message="t('cart.errorPayouts')" />
      </div>
      <p class="mb-5 text-sm leading-relaxed text-gray-400">
        {{ t('tournaments.searchHint') }}
      </p>

      <p class="mb-3 text-base font-semibold">{{ t('tournaments.chooseSearch') }}</p>

      <NuxtLink :to="`/tournaments/${slug}/search/face`" class="search-card mb-3">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <AppIcon name="face" class="h-6 w-6" />
        </div>
        <div>
          <div class="font-semibold">{{ t('tournaments.searchByFace') }}</div>
          <div class="mt-1 text-xs text-gray-500">{{ t('tournaments.searchByFaceHint') }}</div>
        </div>
      </NuxtLink>

      <NuxtLink :to="`/tournaments/${slug}/search`" class="search-card">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-gray-300">
          <AppIcon name="user" class="h-6 w-6" />
        </div>
        <div>
          <div class="font-semibold">{{ t('tournaments.searchByName') }}</div>
          <div class="mt-1 text-xs text-gray-500">{{ t('tournaments.searchByNameHint') }}</div>
        </div>
      </NuxtLink>

      <section v-if="publishedPhotos.length" class="mt-8">
        <h2 class="mb-1 font-semibold">{{ t('tournaments.publishedTitle') }}</h2>
        <p class="mb-4 text-sm text-gray-500">{{ t('tournaments.publishedHint') }}</p>
        <PhotoGrid :photos="publishedPhotos" />
      </section>
    </div>
  </div>
</template>
