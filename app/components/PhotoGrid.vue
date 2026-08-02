<script setup lang="ts">
import type { Photo } from '~/types'

defineProps<{
  photos: Photo[]
  loading?: boolean
  selectable?: boolean
}>()
</script>

<template>
  <div v-if="loading" class="grid grid-cols-3 gap-1.5">
    <div v-for="n in 9" :key="n" class="aspect-[2/3] animate-pulse rounded-xl bg-gray-200" />
  </div>

  <div v-else-if="photos.length === 0" class="rounded-2xl bg-white p-10 text-center text-gray-500">
    Фото не найдены
  </div>

  <div v-else class="grid grid-cols-3 gap-1.5">
    <PhotoCard
      v-for="photo in photos"
      :key="photo.id"
      :photo="photo"
      :selectable="selectable"
    />
  </div>
</template>
