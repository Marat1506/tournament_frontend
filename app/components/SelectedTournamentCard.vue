<script setup lang="ts">
import type { Tournament } from '~/types'

defineProps<{
  tournament: Tournament
  changeTo?: string
}>()

const { t, locale } = useI18n()

function formatDate(date?: string) {
  if (!date) return ''
  const currentLocale = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(date).toLocaleDateString(currentLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="card flex items-center gap-3 p-3">
    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <div class="min-w-0 flex-1">
      <div class="truncate font-semibold">{{ tournament.name }}</div>
      <div v-if="tournament.location" class="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <AppIcon name="pin" class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate">{{ tournament.location }}</span>
      </div>
      <div v-if="tournament.date" class="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
        <AppIcon name="calendar" class="h-3.5 w-3.5 shrink-0" />
        <span>{{ formatDate(tournament.date) }}</span>
      </div>
    </div>
    <NuxtLink
      v-if="changeTo"
      :to="changeTo"
      class="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold text-brand-400 transition hover:bg-brand-500/10 active:scale-95"
    >
      <AppIcon name="pencil" class="h-4 w-4" />
      {{ t('search.changeTournament') }}
    </NuxtLink>
  </div>
</template>
