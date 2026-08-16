<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const api = useApi()
const route = useRoute()

const email = ref((route.query.email as string) || '')
const error = ref('')
const loading = ref(false)

const loginLink = computed(() =>
  route.query.role === 'photographer' ? '/photographer/login' : '/login',
)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await api.forgotPassword(email.value.trim())
    const q = new URLSearchParams({ email: email.value.trim() })
    if (route.query.role === 'photographer') q.set('role', 'photographer')
    await navigateTo(`/reset-password?${q.toString()}`)
  }
  catch {
    error.value = t('auth.resetSendFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('auth.forgotTitle')">
      <template #left>
        <NuxtLink :to="loginLink" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>
    <div class="page-container max-w-md">
      <p class="mb-4 text-sm text-gray-400">{{ t('auth.forgotHint') }}</p>
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('auth.resetSending') : t('auth.resetSendBtn') }}
        </button>
      </form>
    </div>
  </div>
</template>
