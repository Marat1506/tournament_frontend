<script setup lang="ts">
const { t } = useI18n()
const api = useApi()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  event_date: '',
  event_location: '',
  message: '',
})

const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')

async function submit() {
  loading.value = true
  errorMsg.value = ''
  try {
    await api.createPhotographerLead({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      event_date: form.event_date || undefined,
      event_location: form.event_location || undefined,
      message: form.message || undefined,
    })
    success.value = true
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string } }
    errorMsg.value = err.data?.error || t('orderPhotographer.submitFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('orderPhotographer.title')">
      <template #left>
        <NuxtLink to="/" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <div v-if="success" class="card p-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
          <AppIcon name="check" class="h-7 w-7" />
        </div>
        <h2 class="text-lg font-semibold">{{ t('orderPhotographer.successTitle') }}</h2>
        <p class="mt-2 text-sm text-gray-600">{{ t('orderPhotographer.successHint') }}</p>
        <NuxtLink to="/" class="btn-primary-solid mt-6">{{ t('orderPhotographer.home') }}</NuxtLink>
      </div>

      <form v-else class="card space-y-4 p-5" @submit.prevent="submit">
        <p class="text-sm text-gray-400">{{ t('orderPhotographer.intro') }}</p>
        <p class="text-xs text-gray-500">{{ t('orderPhotographer.adminHint') }}</p>

        <input v-model="form.name" type="text" required :placeholder="t('orderPhotographer.name')" class="input-field">
        <input v-model="form.email" type="email" required placeholder="Email *" class="input-field">
        <input v-model="form.phone" type="tel" :placeholder="t('orderPhotographer.phone')" class="input-field">
        <input v-model="form.event_date" type="date" class="input-field">
        <input v-model="form.event_location" type="text" :placeholder="t('orderPhotographer.location')" class="input-field">
        <textarea v-model="form.message" rows="4" :placeholder="t('orderPhotographer.message')" class="input-field" />

        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('orderPhotographer.submitting') : t('orderPhotographer.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>
