<script setup lang="ts">
const props = withDefaults(defineProps<{
  current: 1 | 2 | 3 | 4
  steps?: 3 | 4
  tournamentTo?: string
  completed?: boolean
  thirdLabel?: string
}>(), {
  steps: 3,
})

const { t } = useI18n()
const NuxtLinkComponent = resolveComponent('NuxtLink')

const items = computed(() => {
  const list = [
    { label: t('tournaments.stepTournament'), to: props.current > 1 ? (props.tournamentTo || '/tournaments') : '' },
    { label: t('tournaments.stepSearch'), to: '' },
    { label: props.thirdLabel || t('tournaments.stepPhotos'), to: '' },
  ]
  if (props.steps === 4) {
    list.push({ label: t('tournaments.stepPay'), to: '' })
  }
  return list
})
</script>

<template>
  <ol
    class="mb-6 grid px-1"
    :class="steps === 4 ? 'grid-cols-4' : 'grid-cols-3'"
    :aria-label="t('tournaments.progressLabel')"
  >
    <li v-for="(step, index) in items" :key="step.label" class="relative min-w-0">
      <span
        v-if="index > 0"
        class="absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2"
        :class="index + 1 <= current ? 'bg-brand-500' : 'bg-white/10'"
        aria-hidden="true"
      />
      <component
        :is="step.to ? NuxtLinkComponent : 'div'"
        :to="step.to || undefined"
        class="relative z-10 flex min-w-0 flex-col items-center gap-2"
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-page transition"
          :class="index + 1 <= current ? 'bg-brand-500 text-white' : 'bg-[#202633] text-gray-500'"
          :aria-current="index + 1 === current ? 'step' : undefined"
        >
          <AppIcon
            v-if="index + 1 < current || (index + 1 === current && completed)"
            name="check"
            class="h-4 w-4"
          />
          <span v-else>{{ index + 1 }}</span>
        </span>
        <span
          class="w-full truncate px-0.5 text-center text-[11px] font-medium leading-tight"
          :class="index + 1 <= current ? 'text-brand-400' : 'text-gray-500'"
        >
          {{ step.label }}
        </span>
      </component>
    </li>
  </ol>
</template>
