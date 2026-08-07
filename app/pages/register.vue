<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const { applyLocale } = useAppLocale()
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
    const resp = await api.register({ ...form, role: 'client' })
    if (resp.user.locale && ['ru', 'en', 'es'].includes(resp.user.locale)) {
      await applyLocale(resp.user.locale as 'ru' | 'en' | 'es', false)
    }
    auth.setSession(resp)
    await router.push('/profile')
  } catch {
    error.value = t('auth.registerError')
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
      <p class="mb-4 text-sm text-gray-400">{{ t('auth.registerHint') }}</p>
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="form.name" type="text" class="input-field" :placeholder="t('settings.name')" required>
        <input v-model="form.email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <input v-model="form.password" type="password" class="input-field" :placeholder="t('auth.password')" minlength="8" required>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('auth.registering') : t('auth.registerBtn') }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500">
        {{ t('auth.hasAccount') }}
        <NuxtLink to="/login" class="font-medium text-brand-400">{{ t('auth.loginBtn') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
