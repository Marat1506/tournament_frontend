<script setup lang="ts">
defineProps<{
  id: string
  active: 'photos' | 'sales' | 'edit'
}>()

const { t } = useI18n()
</script>

<template>
  <div class="mb-5 flex gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
    <NuxtLink
      :to="`/photographer/tournaments/${id}`"
      class="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold leading-tight"
      :class="active === 'photos' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="photos" class="h-4 w-4" />
      {{ t('photographer.tabPhotos') }}
    </NuxtLink>
    <NuxtLink
      :to="`/photographer/tournaments/${id}/stats`"
      class="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold leading-tight"
      :class="active === 'sales' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="chart" class="h-4 w-4" />
      {{ t('photographer.tabSales') }}
    </NuxtLink>
    <NuxtLink
      :to="`/photographer/tournaments/${id}/settings`"
      class="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold leading-tight"
      :class="active === 'edit' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="pencil" class="h-4 w-4" />
      {{ t('photographer.tabEdit') }}
    </NuxtLink>
  </div>
</template>
