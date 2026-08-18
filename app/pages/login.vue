<script setup lang="ts">
definePageMeta({ ssr: false })

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
const showPhotographerLink = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  showPhotographerLink.value = false
  loading.value = true
  try {
    const resp = await api.login({ email: email.value, password: password.value })
    if (resp.user.locale && ['ru', 'en', 'es'].includes(resp.user.locale)) {
      await applyLocale(resp.user.locale as 'ru' | 'en' | 'es', false)
    }
    if (resp.user.role === 'photographer') {
      error.value = t('auth.loginAsPhotographer')
      showPhotographerLink.value = true
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
      <AuthSessionNotice world="client" />
      <p class="mb-4 text-sm text-gray-400">{{ t('auth.loginHint') }}</p>
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <input v-model="password" type="password" class="input-field" :placeholder="t('auth.password')" required>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <NuxtLink
          v-if="showPhotographerLink"
          to="/photographer/login"
          class="block text-sm font-medium text-brand-400"
        >
          {{ t('auth.goPhotographerLogin') }}
        </NuxtLink>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('auth.loggingIn') : t('auth.loginBtn') }}
        </button>
      </form>
      <p class="mt-3 text-center text-sm">
        <NuxtLink to="/forgot-password" class="font-medium text-brand-400">{{ t('auth.forgotPassword') }}</NuxtLink>
      </p>
      <p class="mt-4 text-center text-sm text-gray-500">
        {{ t('auth.noAccount') }}
        <NuxtLink to="/register" class="font-medium text-brand-400">{{ t('auth.registerTitle') }}</NuxtLink>
      </p>
      <p class="mt-6 text-center text-sm text-gray-500">
        <NuxtLink to="/photographer/login" class="font-medium text-brand-400">{{ t('auth.iAmPhotographer') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
