<script setup lang="ts">
defineProps<{
  current: 1 | 2 | 3
}>()

const steps = ['Турнир', 'Поиск', 'Фото']
</script>

<template>
  <div class="mb-6 px-1">
    <div class="flex items-start">
      <template v-for="(step, index) in steps" :key="step">
        <div class="flex w-16 flex-col items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            :class="index + 1 <= current ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'"
          >
            {{ index + 1 }}
          </div>
          <span
            class="text-center text-[11px] font-medium leading-tight"
            :class="index + 1 <= current ? 'text-brand-600' : 'text-gray-400'"
          >
            {{ step }}
          </span>
        </div>
        <div
          v-if="index < steps.length - 1"
          class="mx-1 mt-4 h-0.5 flex-1 rounded-full"
          :class="index + 1 < current ? 'bg-brand-600' : 'bg-gray-200'"
        />
      </template>
    </div>
  </div>
</template>
