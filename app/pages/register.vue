<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const { applyLocale } = useAppLocale()
const api = useApi()
const router = useRouter()
const { afterClientSession } = useClientAuthRedirect()

const form = reactive({
  name: '',
  email: '',
  password: '',
})
const error = ref('')
const doorLink = ref<'photographer' | 'client' | ''>('')
const loading = ref(false)
const termsAccepted = ref(false)

async function submit() {
  error.value = ''
  doorLink.value = ''
  if (!termsAccepted.value) {
    error.value = t('auth.termsRequired')
    return
  }
  loading.value = true
  try {
    const resp = await api.register({ ...form, role: 'client' })
    if (resp.user.locale && ['ru', 'en', 'es'].includes(resp.user.locale)) {
      await applyLocale(resp.user.locale as 'ru' | 'en' | 'es', false)
    }
    await afterClientSession(resp)
  } catch (e: unknown) {
    const key = mapApiError(e, [
      { match: 'email already registered as photographer', key: 'auth.registerExistsPhotographer' },
      { match: 'email already registered as client', key: 'auth.registerExistsClient' },
      { match: 'email already registered as admin', key: 'auth.registerExistsAdmin' },
      { match: 'email already registered', key: 'auth.registerExists' },
      { match: 'password must be at least 8', key: 'auth.weakPassword' },
    ], 'auth.registerError')
    error.value = t(key)
    if (key === 'auth.registerExistsPhotographer') doorLink.value = 'photographer'
    if (key === 'auth.registerExistsClient') doorLink.value = 'client'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('auth.registerTitle')">
      <template #left>
        <NuxtLink to="/login" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>
    <div class="page-container max-w-md">
      <AuthSessionNotice world="client" />
      <p class="mb-4 text-sm text-gray-400">{{ t('auth.registerHint') }}</p>
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="form.name" type="text" class="input-field" :placeholder="t('settings.name')" required>
        <input v-model="form.email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <input v-model="form.password" type="password" class="input-field" :placeholder="t('auth.password')" minlength="8" required>
        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3">
          <input v-model="termsAccepted" type="checkbox" class="mt-1 h-4 w-4 rounded border-gray-500" required>
          <span class="text-sm text-gray-300">
            {{ t('auth.termsPrefix') }}
            <NuxtLink to="/terms" class="text-brand-400 hover:underline">{{ t('auth.termsLink') }}</NuxtLink>
            {{ t('auth.termsAnd') }}
            <NuxtLink to="/privacy" class="text-brand-400 hover:underline">{{ t('auth.privacyLink') }}</NuxtLink>
          </span>
        </label>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <NuxtLink
          v-if="doorLink === 'photographer'"
          to="/photographer/login"
          class="block text-sm font-medium text-brand-400"
        >
          {{ t('auth.goPhotographerLogin') }}
        </NuxtLink>
        <NuxtLink
          v-else-if="doorLink === 'client'"
          to="/login"
          class="block text-sm font-medium text-brand-400"
        >
          {{ t('auth.loginBtn') }}
        </NuxtLink>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading || !termsAccepted">
          {{ loading ? t('auth.registering') : t('auth.registerBtn') }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500">
        {{ t('auth.hasAccount') }}
        <NuxtLink to="/login" class="font-medium text-brand-400">{{ t('auth.loginBtn') }}</NuxtLink>
      </p>
      <p class="mt-6 text-center text-sm text-gray-500">
        <NuxtLink to="/photographer/register" class="font-medium text-brand-400">{{ t('auth.iAmPhotographer') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
