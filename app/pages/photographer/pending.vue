<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.registerTitle')" />
    <div class="page-container max-w-md">
      <div class="card space-y-4 p-6 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <AppIcon name="check" class="h-7 w-7" />
        </div>
        <h2 class="text-lg font-semibold">{{ t('photographer.applicationSubmitted') }}</h2>
        <p class="text-sm text-gray-500">{{ t('photographer.applicationSubmittedHint') }}</p>
        <NuxtLink to="/photographer/login" class="btn-primary-solid w-full">
          {{ t('photographer.loginBtn') }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
