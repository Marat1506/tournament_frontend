<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const email = ref('photographer@bjjphotos.local')
const password = ref('password123')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const resp = await api.login({ email: email.value, password: password.value })
    if (resp.user.role !== 'photographer') {
      error.value = t('photographer.wrongRole')
      return
    }
    auth.setSession(resp)
    await router.push('/photographer/dashboard')
  } catch {
    error.value = t('photographer.loginError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.loginTitle')" />
    <div class="page-container max-w-md">
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <input v-model="password" type="password" class="input-field" :placeholder="t('photographer.password')" required>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('photographer.loggingIn') : t('photographer.loginBtn') }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500">
        {{ t('photographer.noAccount') }}
        <NuxtLink to="/photographer/register" class="font-medium text-brand-600">{{ t('photographer.registerLink') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
