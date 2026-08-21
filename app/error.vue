<script setup lang="ts">
const error = useError()
const { t } = useI18n()

const statusCode = computed(() => error.value?.statusCode ?? 500)
const isNotFound = computed(() => statusCode.value === 404)

const errorHint = computed(() => {
  if (isNotFound.value) return t('errors.notFoundHint')
  return t('errors.genericHint')
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-[#0b0f17] px-4 text-center text-white">
    <div class="mb-4 text-6xl font-bold text-brand-400">{{ statusCode }}</div>
    <h1 class="text-xl font-bold">
      {{ isNotFound ? t('errors.notFoundTitle') : t('errors.genericTitle') }}
    </h1>
    <p class="mt-2 max-w-md text-sm text-gray-500">
      {{ errorHint }}
    </p>
    <button class="btn-primary-solid mt-8 !w-auto min-w-48" @click="goHome">
      {{ t('errors.home') }}
    </button>
  </div>
</template>
