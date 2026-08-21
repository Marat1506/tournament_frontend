<script setup lang="ts">
defineProps<{
  title: string
  showHelp?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <header class="sticky top-0 z-40 flex items-center justify-between bg-page/90 px-4 py-3 text-white backdrop-blur-md">
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <slot name="left" />
      <h1 class="min-w-0 truncate text-lg font-bold leading-none">{{ title }}</h1>
    </div>
    <div class="flex shrink-0 items-center gap-2">
      <AppLocaleSwitcher />
      <button
        v-if="showHelp"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-400"
        :aria-label="t('common.help')"
      >
        <AppIcon name="help" class="h-5 w-5" />
      </button>
      <slot name="right" />
    </div>
  </header>
</template>
