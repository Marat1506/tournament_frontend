<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const { applyLocale } = useAppLocale()
const api = useApi()
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const { afterClientSession } = useClientAuthRedirect()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const resp = await api.login({ email: email.value, password: password.value })
    if (resp.user.locale && ['ru', 'en', 'es'].includes(resp.user.locale)) {
      await applyLocale(resp.user.locale as 'ru' | 'en' | 'es', false)
    }
    if (resp.user.role === 'photographer') {
      auth.setSession(resp)
      await router.push('/photographer/dashboard')
      return
    }
    if (resp.user.role === 'admin') {
      auth.setSession(resp)
      await router.push('/admin')
      return
    }
    await afterClientSession(resp, (route.query.redirect as string) || '/profile')
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string } }
    const msg = err.data?.error
    if (msg === 'email not verified') {
      if (import.meta.client) {
        sessionStorage.setItem('bjj_pending_verify_email', email.value.trim())
      }
      await router.push('/confirm-email')
      return
    }
    error.value = t('auth.loginError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('auth.loginTitle')">
      <template #left>
        <NuxtLink to="/profile" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>
    <div class="page-container max-w-md">
      <p class="mb-4 text-sm text-gray-400">{{ t('auth.loginHint') }}</p>
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <input v-model="password" type="password" class="input-field" :placeholder="t('auth.password')" required>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('auth.loggingIn') : t('auth.loginBtn') }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500">
        {{ t('auth.noAccount') }}
        <NuxtLink to="/register" class="font-medium text-brand-400">{{ t('auth.registerTitle') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
