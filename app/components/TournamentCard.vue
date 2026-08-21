<script setup lang="ts">
import type { Tournament } from '~/types'

const props = withDefaults(defineProps<{
  tournament: Tournament
  compact?: boolean
  layout?: 'row' | 'tile' | 'featured' | 'list'
  featuredSize?: 'default' | 'home'
  to?: string
  showCta?: boolean
}>(), {
  layout: 'row',
  featuredSize: 'default',
  showCta: true,
})

const { t, locale } = useI18n()

const linkTo = computed(() => props.to || `/tournaments/${props.tournament.slug}`)
const isHomeFeatured = computed(() => props.featuredSize === 'home')

function formatDate(date?: string) {
  if (!date) return ''
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(date).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function dateBadge(date?: string) {
  if (!date) return ''
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(date).toLocaleDateString(loc, { day: 'numeric', month: 'short' }).toUpperCase()
}
</script>

<template>
  <NuxtLink
    v-if="!compact && layout === 'tile'"
    :to="linkTo"
    class="flex h-full flex-col transition active:scale-[0.99]"
  >
    <div class="relative aspect-square overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
      <span
        v-if="tournament.date"
        class="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      >
        {{ dateBadge(tournament.date) }}
      </span>
    </div>
    <h3 class="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">{{ tournament.name }}</h3>
    <p v-if="tournament.location" class="line-clamp-1 text-xs text-gray-500">{{ tournament.location }}</p>
    <p class="mt-1 text-xs font-medium text-brand-400">{{ t('tournaments.uploadedCount', { count: tournament.photo_count }) }}</p>
  </NuxtLink>

  <NuxtLink
    v-else-if="layout === 'featured'"
    :to="linkTo"
    class="card flex shrink-0 snap-start flex-col overflow-hidden transition active:scale-[0.99]"
    :class="isHomeFeatured
      ? 'w-[calc((min(100vw,32rem)-3rem-1rem)/3)] min-w-[calc((min(100vw,32rem)-3rem-1rem)/3)]'
      : 'w-[240px]'"
  >
    <div
      class="relative overflow-hidden bg-white/5"
      :class="isHomeFeatured ? 'h-[72px]' : 'h-36'"
    >
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="cover" />
      <span
        v-if="tournament.date"
        class="absolute rounded-md bg-black/75 font-bold uppercase tracking-wide"
        :class="isHomeFeatured ? 'left-1.5 top-1.5 px-1.5 py-0.5 text-[8px]' : 'left-2.5 top-2.5 px-2 py-0.5 text-[10px]'"
      >
        {{ dateBadge(tournament.date) }}
      </span>
    </div>
    <div class="flex flex-1 flex-col" :class="isHomeFeatured ? 'p-2' : 'p-3'">
      <h3
        class="font-bold leading-snug"
        :class="isHomeFeatured ? 'line-clamp-1 text-[11px]' : 'line-clamp-2 text-sm'"
      >
        {{ tournament.name }}
      </h3>
      <p
        v-if="tournament.location"
        class="flex items-center gap-0.5 text-gray-400"
        :class="isHomeFeatured ? 'mt-1 text-[9px]' : 'mt-1.5 gap-1 text-xs'"
      >
        <AppIcon name="pin" class="shrink-0" :class="isHomeFeatured ? 'h-3 w-3' : 'h-3.5 w-3.5'" />
        <span class="truncate">{{ tournament.location }}</span>
      </p>
      <p
        v-if="tournament.date && !isHomeFeatured"
        class="mt-1 flex items-center gap-1 text-xs text-gray-400"
      >
        <AppIcon name="calendar" class="h-3.5 w-3.5 shrink-0" />
        {{ formatDate(tournament.date) }}
      </p>
      <span
        v-if="showCta"
        class="btn-outline w-full"
        :class="isHomeFeatured ? 'mt-2 py-1 text-[9px]' : 'mt-3'"
      >
        {{ t('home.seePhotos') }}
      </span>
    </div>
  </NuxtLink>

  <NuxtLink
    v-else-if="layout === 'list'"
    :to="linkTo"
    class="card flex gap-3 p-3 transition active:scale-[0.99]"
  >
    <div class="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
      <span
        v-if="tournament.date"
        class="absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase"
      >
        {{ dateBadge(tournament.date) }}
      </span>
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <h3 class="line-clamp-2 font-semibold leading-snug">{{ tournament.name }}</h3>
      <p v-if="tournament.location" class="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <AppIcon name="pin" class="h-3.5 w-3.5 shrink-0" />
        <span class="truncate">{{ tournament.location }}</span>
      </p>
      <p v-if="tournament.date" class="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
        <AppIcon name="calendar" class="h-3.5 w-3.5 shrink-0" />
        {{ formatDate(tournament.date) }}
      </p>
      <div class="mt-auto flex items-center justify-between gap-2 pt-2">
        <span v-if="showCta" class="btn-outline py-1.5 text-xs">{{ t('home.seePhotos') }}</span>
        <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
      </div>
    </div>
  </NuxtLink>

  <NuxtLink
    v-else-if="!compact"
    :to="linkTo"
    class="card flex h-full gap-3 p-3 transition active:scale-[0.99]"
  >
    <div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <h3 class="line-clamp-2 min-h-[2.5rem] font-semibold leading-snug">{{ tournament.name }}</h3>
      <p class="mt-1 line-clamp-1 text-sm text-gray-500">{{ formatDate(tournament.date) || ' ' }}</p>
      <p class="line-clamp-1 text-sm text-gray-500">{{ tournament.location || ' ' }}</p>
      <p class="mt-auto pt-1 text-xs font-medium text-brand-400">{{ t('tournaments.uploadedCount', { count: tournament.photo_count }) }}</p>
    </div>
  </NuxtLink>

  <div v-else class="card flex h-full gap-3 p-3 transition">
    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
      <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <h3 class="line-clamp-2 font-semibold leading-snug">{{ tournament.name }}</h3>
      <p v-if="tournament.location" class="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <AppIcon name="pin" class="h-3.5 w-3.5" />
        <span class="truncate">{{ tournament.location }}</span>
      </p>
      <p v-if="tournament.date" class="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
        <AppIcon name="calendar" class="h-3.5 w-3.5" />
        {{ formatDate(tournament.date) }}
      </p>
    </div>
  </div>
</template>
