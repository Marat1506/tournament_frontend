<script setup lang="ts">
defineProps<{
  id: string
  active: 'upload' | 'athletes' | 'sales' | 'edit'
}>()

const { t } = useI18n()
</script>

<template>
  <div class="mb-5 flex gap-1 rounded-2xl bg-white/5 p-1 ring-1 ring-white/10">
    <NuxtLink
      :to="`/photographer/tournaments/${id}`"
      class="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-semibold leading-tight"
      :class="active === 'upload' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="upload" class="h-4 w-4" />
      {{ t('photographer.tabUpload') }}
    </NuxtLink>
    <NuxtLink
      :to="`/photographer/tournaments/${id}/photos`"
      class="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-semibold leading-tight"
      :class="active === 'athletes' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="user" class="h-4 w-4" />
      {{ t('photographer.tabAthletes') }}
    </NuxtLink>
    <NuxtLink
      :to="`/photographer/tournaments/${id}/stats`"
      class="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-semibold leading-tight"
      :class="active === 'sales' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="chart" class="h-4 w-4" />
      {{ t('photographer.tabSales') }}
    </NuxtLink>
    <NuxtLink
      :to="`/photographer/tournaments/${id}/settings`"
      class="flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-semibold leading-tight"
      :class="active === 'edit' ? 'bg-brand-600 text-white' : 'text-gray-400'"
    >
      <AppIcon name="pencil" class="h-4 w-4" />
      {{ t('photographer.tabEdit') }}
    </NuxtLink>
  </div>
</template>
