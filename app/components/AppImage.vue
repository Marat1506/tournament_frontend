<script setup lang="ts">
defineProps<{
  src?: string | null
  alt?: string
  aspect?: 'photo' | 'cover' | 'square'
  rounded?: 'lg' | 'xl' | '2xl' | 'none'
}>()

const failed = ref(false)
const defaults = {
  photo: '/placeholder-photo.svg',
  cover: '/placeholder-hero.svg',
  square: '/placeholder-tournament.svg',
}
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt || ''"
    class="h-full w-full object-cover"
    loading="lazy"
    @error="failed = true"
  >
  <img
    v-else
    :src="defaults[aspect || 'photo']"
    :alt="alt || 'Заглушка'"
    class="h-full w-full object-cover"
  >
</template>
