<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string
const api = useApi()

const query = ref('')

const { data: tournament } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))

const { data: athletes, pending, refresh } = await useAsyncData(
  `athletes-${slug}`,
  () => api.searchAthletes(slug, query.value),
)

let queryTimer: ReturnType<typeof setTimeout>
watch(query, () => {
  clearTimeout(queryTimer)
  queryTimer = setTimeout(() => refresh(), 300)
})

function selectAthlete(id: string, name: string) {
  navigateTo(`/tournaments/${slug}/photos?athlete_id=${id}&athlete_name=${encodeURIComponent(name)}`)
}
</script>

<template>
  <div>
    <AppPageHeader title="Поиск по имени">
      <template #left>
        <NuxtLink :to="`/tournaments/${slug}`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <SearchStepper :current="2" />

      <TournamentCard v-if="tournament" :tournament="tournament" compact class="mb-4" />

      <input
        v-model="query"
        type="search"
        placeholder="Введите имя спортсмена..."
        class="input-field mb-4"
        autofocus
      >

      <div v-if="pending" class="space-y-2">
        <div v-for="n in 4" :key="n" class="card h-16 animate-pulse bg-gray-100" />
      </div>

      <div v-else-if="athletes?.data?.length" class="space-y-2">
        <button
          v-for="athlete in athletes.data"
          :key="athlete.id"
          class="card flex w-full items-center justify-between p-4 text-left transition active:scale-[0.99]"
          @click="selectAthlete(athlete.id, athlete.name)"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <AppIcon name="user" class="h-5 w-5" />
            </div>
            <div>
              <div class="font-semibold">{{ athlete.name }}</div>
              <div v-if="athlete.category" class="text-sm text-gray-500">{{ athlete.category }}</div>
            </div>
          </div>
          <div class="text-sm font-semibold text-brand-600">{{ athlete.photo_count }}</div>
        </button>
      </div>

      <div v-else-if="query.length >= 1" class="card p-10 text-center text-gray-500">
        Спортсмены не найдены
      </div>

      <p v-else class="text-center text-sm text-gray-500">
        Начните вводить имя, например «Иван»
      </p>
    </div>
  </div>
</template>
