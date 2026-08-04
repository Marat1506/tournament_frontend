<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const api = useApi()
const auth = useAuthStore()

const token = computed(() => (route.query.token as string) || '')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const error = ref('')

async function verify() {
  if (!token.value) {
    status.value = 'error'
    error.value = t('verifyEmail.noToken')
    return
  }
  status.value = 'loading'
  error.value = ''
  try {
    await api.verifyEmail(token.value)
    status.value = 'success'
    if (auth.isLoggedIn) {
      const me = await api.me()
      auth.setUser(me)
    }
  } catch {
    status.value = 'error'
    error.value = t('verifyEmail.expired')
  }
}

onMounted(verify)
</script>

<template>
  <div>
    <AppPageHeader :title="t('verifyEmail.title')" />

    <div class="page-container max-w-md text-center">
      <div v-if="status === 'loading'" class="card p-8">
        <p class="text-gray-400">{{ t('verifyEmail.loading') }}</p>
      </div>

      <div v-else-if="status === 'success'" class="card space-y-4 p-8">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
          <AppIcon name="check" class="h-8 w-8" />
        </div>
        <h1 class="text-xl font-bold">{{ t('verifyEmail.successTitle') }}</h1>
        <p class="text-sm text-gray-400">{{ t('verifyEmail.successHint') }}</p>
        <NuxtLink to="/profile" class="btn-primary-solid inline-block w-full">{{ t('verifyEmail.toProfile') }}</NuxtLink>
      </div>

      <div v-else class="card space-y-4 p-8">
        <p class="text-sm text-red-400">{{ error || t('verifyEmail.failed') }}</p>
        <NuxtLink v-if="auth.isLoggedIn" to="/profile" class="btn-primary-solid inline-block w-full">
          {{ t('verifyEmail.toProfile') }}
        </NuxtLink>
        <NuxtLink v-else to="/login" class="btn-secondary inline-block w-full">{{ t('verifyEmail.login') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>
