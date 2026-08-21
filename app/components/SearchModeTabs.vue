<script setup lang="ts">
defineProps<{
  slug: string
  mode: 'face' | 'name'
}>()

const { t } = useI18n()
</script>

<template>
  <div class="mb-5 flex gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
    <NuxtLink
      :to="`/tournaments/${slug}/search/face`"
      class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
      :class="mode === 'face' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="face" class="h-4 w-4" />
      {{ t('search.tabSelfie') }}
    </NuxtLink>
    <NuxtLink
      :to="`/tournaments/${slug}/search`"
      class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
      :class="mode === 'name' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="user" class="h-4 w-4" />
      {{ t('search.tabName') }}
    </NuxtLink>
  </div>
</template>
