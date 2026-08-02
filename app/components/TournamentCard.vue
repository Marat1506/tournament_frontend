<script setup lang="ts">
import type { Tournament } from '~/types'

defineProps<{
  tournament: Tournament
  compact?: boolean
}>()

function formatDate(date?: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <NuxtLink
    v-if="!compact"
    :to="`/tournaments/${tournament.slug}`"
    class="card flex gap-3 p-3 transition active:scale-[0.99]"
  >
    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="line-clamp-2 font-semibold leading-snug">{{ tournament.name }}</h3>
      <p v-if="tournament.date" class="mt-1 text-sm text-gray-500">{{ formatDate(tournament.date) }}</p>
      <p v-if="tournament.location" class="text-sm text-gray-500">{{ tournament.location }}</p>
      <p class="mt-1 text-xs font-medium text-brand-600">{{ tournament.photo_count }} фото</p>
    </div>
  </NuxtLink>

  <div v-else class="card flex gap-3 p-3 transition">
    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="line-clamp-2 font-semibold leading-snug">{{ tournament.name }}</h3>
      <p v-if="tournament.date" class="mt-1 text-sm text-gray-500">{{ formatDate(tournament.date) }}</p>
      <p v-if="tournament.location" class="text-sm text-gray-500">{{ tournament.location }}</p>
    </div>
  </div>
</template>
