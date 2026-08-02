<script setup lang="ts">
defineProps<{
  title: string
  showHelp?: boolean
  dark?: boolean
}>()
</script>

<template>
  <header
    class="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
    :class="dark ? 'bg-[#0b0f17]/90 text-white backdrop-blur-md' : 'bg-[#f5f7fb]/95 text-gray-900 backdrop-blur-md'"
  >
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <slot name="left" />
      <h1 class="truncate text-lg font-bold">{{ title }}</h1>
    </div>
    <button
      v-if="showHelp"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400"
      aria-label="Помощь"
    >
      <AppIcon name="help" class="h-5 w-5" />
    </button>
    <slot v-else name="right" />
  </header>
</template>
