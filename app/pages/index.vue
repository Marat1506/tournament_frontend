<script setup lang="ts">
definePageMeta({ nav: 'dark' })

const api = useApi()
const { data: tournaments } = await useAsyncData('home-tournaments', () => api.getTournaments())
</script>

<template>
  <div class="pb-24">
    <header class="flex items-center justify-between px-4 py-4">
      <div class="flex items-center gap-2.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
          <AppIcon name="camera" class="h-5 w-5" />
        </div>
        <span class="text-base font-bold tracking-[0.12em]">BJJ PHOTOS</span>
      </div>
      <button class="flex h-10 w-10 items-center justify-center text-gray-300" aria-label="Уведомления">
        <AppIcon name="bell" class="h-5 w-5" />
      </button>
    </header>

    <section class="relative mx-auto max-w-lg overflow-hidden">
      <div class="h-[220px] w-full">
        <AppImage aspect="cover" alt="Hero" />
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/40 to-transparent" />
      <div class="absolute bottom-0 left-0 right-0 px-4 pb-2">
        <h1 class="text-[26px] font-bold leading-tight">Ваши лучшие моменты с турниров</h1>
        <p class="mt-1 text-sm text-gray-300">Найдите, скачайте и поделитесь своими фотографиями</p>
      </div>
    </section>

    <div class="mx-auto max-w-lg space-y-3 px-4 pt-5">
      <NuxtLink to="/tournaments" class="btn-primary">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <AppIcon name="search" class="h-5 w-5" />
        </div>
        <div>
          <div>Найти мои фото</div>
          <div class="text-xs font-normal text-white/75">Поиск по турниру, имени или лицу</div>
        </div>
      </NuxtLink>

      <NuxtLink to="/photographer/login" class="btn-secondary">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          <AppIcon name="upload" class="h-5 w-5" />
        </div>
        <div>
          <div>Загрузить фото</div>
          <div class="text-xs font-normal text-gray-500">для фотографов</div>
        </div>
      </NuxtLink>

      <div class="grid grid-cols-4 gap-3 pt-3">
        <NuxtLink to="/tournaments" class="flex flex-col items-center gap-2 text-center">
          <div class="quick-icon"><AppIcon name="trophy" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">Поиск по турниру</span>
        </NuxtLink>
        <NuxtLink to="/tournaments" class="flex flex-col items-center gap-2 text-center">
          <div class="quick-icon"><AppIcon name="user" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">Поиск по имени</span>
        </NuxtLink>
        <div class="flex flex-col items-center gap-2 text-center opacity-40">
          <div class="quick-icon"><AppIcon name="face" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">Распознавание лица</span>
        </div>
        <div class="flex flex-col items-center gap-2 text-center opacity-40">
          <div class="quick-icon"><AppIcon name="shirt" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">Футболки и принты</span>
        </div>
      </div>

      <section v-if="tournaments?.data?.length" class="space-y-3 pt-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold">Недавние турниры</h2>
          <NuxtLink to="/tournaments" class="text-sm font-medium text-brand-400">Смотреть все</NuxtLink>
        </div>
        <div class="-mx-1 flex gap-3 overflow-x-auto pb-2">
          <div
            v-for="t in tournaments.data.slice(0, 3)"
            :key="t.id"
            class="w-[220px] shrink-0"
          >
            <TournamentCard :tournament="t" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
