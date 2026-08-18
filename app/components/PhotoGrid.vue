<script setup lang="ts">
import type { Photo } from '~/types'

withDefaults(defineProps<{
  photos: Photo[]
  loading?: boolean
  selectable?: boolean
  purchasesEnabled?: boolean
  athleteId?: string
  fromFaceSearch?: boolean
}>(), {
  loading: false,
  selectable: false,
  purchasesEnabled: true,
})

const { t } = useI18n()
</script>

<template>
  <div v-if="loading" class="grid grid-cols-3 gap-1.5">
    <div v-for="n in 9" :key="n" class="aspect-[2/3] animate-pulse rounded-xl bg-white/10" />
  </div>

  <div v-else-if="photos.length === 0" class="card p-10 text-center text-gray-500">
    {{ t('favorites.noPhotos') }}
  </div>

  <div v-else class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
    <PhotoCard
      v-for="photo in photos"
      :key="photo.id"
      :photo="photo"
      :selectable="Boolean(selectable && purchasesEnabled !== false)"
      :athlete-id="athleteId"
      :from-face-search="fromFaceSearch"
    />
  </div>
</template>
