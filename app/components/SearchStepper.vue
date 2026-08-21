<script setup lang="ts">
const props = withDefaults(defineProps<{
  current: 1 | 2 | 3 | 4
  steps?: 3 | 4
  tournamentTo?: string
}>(), {
  steps: 3,
})

const { t } = useI18n()

const items = computed(() => {
  const list = [
    { label: t('tournaments.stepTournament'), to: props.current > 1 ? (props.tournamentTo || '/tournaments') : '' },
    { label: t('tournaments.stepSearch'), to: '' },
    { label: t('tournaments.stepPhotos'), to: '' },
  ]
  if (props.steps === 4) {
    list.push({ label: t('tournaments.stepPay'), to: '' })
  }
  return list
})
</script>

<template>
  <div class="mb-6 px-1">
    <div class="flex items-start">
      <template v-for="(step, index) in items" :key="step.label">
        <NuxtLink
          v-if="step.to"
          :to="step.to"
          class="flex w-16 flex-col items-center gap-2"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            :class="index + 1 <= current ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-500'"
          >
            <AppIcon v-if="index + 1 < current" name="check" class="h-4 w-4" />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            class="text-center text-[11px] font-medium leading-tight"
            :class="index + 1 <= current ? 'text-brand-400' : 'text-gray-400'"
          >
            {{ step.label }}
          </span>
        </NuxtLink>
        <div
          v-else
          class="flex w-16 flex-col items-center gap-2"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            :class="index + 1 <= current ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-500'"
          >
            <AppIcon v-if="index + 1 < current" name="check" class="h-4 w-4" />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            class="text-center text-[11px] font-medium leading-tight"
            :class="index + 1 <= current ? 'text-brand-400' : 'text-gray-400'"
          >
            {{ step.label }}
          </span>
        </div>
        <div
          v-if="index < items.length - 1"
          class="mx-1 mt-4 h-0.5 flex-1 rounded-full"
          :class="index + 1 < current ? 'bg-brand-600' : 'bg-white/10'"
        />
      </template>
    </div>
  </div>
</template>
