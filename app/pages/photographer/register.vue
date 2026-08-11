<script setup lang="ts">
definePageMeta({})

import { CODE_SENT_KEY, PENDING_EMAIL_KEY } from '~/composables/useEmailVerification'

const { t } = useI18n()
const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
})
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const resp = await api.register({ ...form, role: 'photographer' })
    auth.logout()
    if (import.meta.client) {
      sessionStorage.setItem(PENDING_EMAIL_KEY, resp.user.email)
      sessionStorage.setItem(CODE_SENT_KEY, '1')
    }
    await router.push('/confirm-email?role=photographer')
  }
  catch {
    error.value = t('photographer.registerError')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.registerTitle')" />
    <div class="page-container max-w-md">
      <form class="space-y-4" @submit.prevent="submit">
        <p class="text-sm text-gray-500">{{ t('photographer.registerHint') }}</p>
        <input v-model="form.name" type="text" class="input-field" :placeholder="t('photographer.name')" required>
        <input v-model="form.email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <input v-model="form.password" type="password" class="input-field" :placeholder="t('auth.password')" minlength="8" required>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">{{ t('photographer.submitApplication') }}</button>
      </form>

      <p class="mt-4 text-center text-sm text-gray-500">
        {{ t('photographer.hasAccount') }}
        <NuxtLink to="/photographer/login" class="font-medium text-brand-600">{{ t('photographer.loginBtn') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
