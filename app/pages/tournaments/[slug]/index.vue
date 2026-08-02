<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const api = useApi()

const { data: tournament, error } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))
const { data: recent } = await useAsyncData('recent-tournaments', () => api.getTournaments())

const activeCategory = ref('all')
const categories = [
  { id: 'all', label: 'Все' },
  { id: 'male', label: 'Мужчины' },
  { id: 'female', label: 'Женщины' },
  { id: 'child', label: 'Дети' },
  { id: 'masters', label: 'Мастера' },
]

if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Турнир не найден' })
}
</script>

<template>
  <div v-if="tournament">
    <AppPageHeader title="Найти мои фото" show-help>
      <template #left>
        <NuxtLink to="/tournaments" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <SearchStepper :current="2" />

      <TournamentCard :tournament="tournament" compact class="mb-5" />

      <p class="mb-3 text-base font-semibold">Выберите способ поиска</p>

      <div class="grid grid-cols-2 gap-3">
        <NuxtLink :to="`/tournaments/${slug}/search`" class="search-card">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <AppIcon name="user" class="h-6 w-6" />
          </div>
          <div>
            <div class="font-semibold">Поиск по имени</div>
            <div class="mt-1 text-xs text-gray-500">Введите имя спортсмена</div>
          </div>
        </NuxtLink>

        <div class="search-card opacity-45">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <AppIcon name="face" class="h-6 w-6" />
          </div>
          <div>
            <div class="font-semibold">Поиск по лицу</div>
            <div class="mt-1 text-xs text-gray-500">Загрузите селфи</div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="chip"
          :class="activeCategory === cat.id ? 'chip-active' : 'chip-inactive'"
          @click="activeCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <section v-if="recent?.data?.length" class="mt-8">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-semibold">Недавние турниры</h2>
          <NuxtLink to="/tournaments" class="text-sm font-medium text-brand-600">Смотреть все</NuxtLink>
        </div>
        <div class="-mx-1 flex gap-3 overflow-x-auto pb-2">
          <div
            v-for="t in recent.data.filter(x => x.slug !== slug).slice(0, 3)"
            :key="t.id"
            class="w-[210px] shrink-0"
          >
            <TournamentCard :tournament="t" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
