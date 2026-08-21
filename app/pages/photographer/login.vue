<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const showClientLink = ref(false)
const loading = ref(false)

onMounted(() => {
  if (route.query.rejected === '1') {
    error.value = t('photographer.rejected')
  }
})

async function submit() {
  error.value = ''
  showClientLink.value = false
  loading.value = true
  try {
    const resp = await api.login({ email: email.value, password: password.value })
    if (resp.user.role === 'admin') {
      auth.setSession({
        access_token: resp.access_token!,
        refresh_token: resp.refresh_token!,
        user: resp.user,
      })
      await router.push('/admin')
      return
    }
    if (resp.user.role !== 'photographer') {
      error.value = t('photographer.wrongRole')
      showClientLink.value = true
      return
    }
    auth.setSession({
      access_token: resp.access_token!,
      refresh_token: resp.refresh_token!,
      user: resp.user,
    })
    if (resp.user.status === 'pending') {
      await router.push('/photographer/pending')
      return
    }
    if (resp.user.status === 'rejected') {
      auth.logout()
      error.value = t('photographer.rejected')
      return
    }
    await router.push('/photographer/dashboard')
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string } }
    const msg = err.data?.error
    if (msg === 'email not verified') {
      if (import.meta.client) {
        sessionStorage.setItem('bjj_pending_verify_email', email.value.trim())
      }
      await router.push('/confirm-email?role=photographer')
      return
    }
    if (msg === 'photographer account pending approval') {
      error.value = t('photographer.pendingApproval')
    }
    else if (msg === 'photographer account rejected') {
      error.value = t('photographer.rejected')
    }
    else {
      error.value = t(getCommonApiErrorKey(e) ?? 'photographer.loginError')
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.loginTitle')" />
    <div class="page-container max-w-md">
      <AuthSessionNotice world="photographer" />
      <p class="mb-4 text-sm text-gray-400">{{ t('photographer.loginHint') }}</p>
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="email" type="email" class="input-field" :placeholder="t('auth.email')" required>
        <input v-model="password" type="password" class="input-field" :placeholder="t('photographer.password')" required>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <NuxtLink
          v-if="showClientLink"
          to="/login"
          class="block text-sm font-medium text-brand-400"
        >
          {{ t('photographer.goClientLogin') }}
        </NuxtLink>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('photographer.loggingIn') : t('photographer.loginBtn') }}
        </button>
      </form>
      <p class="mt-3 text-center text-sm">
        <NuxtLink to="/forgot-password?role=photographer" class="font-medium text-brand-600">{{ t('auth.forgotPassword') }}</NuxtLink>
      </p>
      <p class="mt-4 text-center text-sm text-gray-500">
        {{ t('photographer.noAccount') }}
        <NuxtLink to="/photographer/register" class="font-medium text-brand-600">{{ t('photographer.registerLink') }}</NuxtLink>
      </p>
      <p class="mt-6 text-center text-sm text-gray-500">
        <NuxtLink to="/login" class="font-medium text-brand-400">{{ t('photographer.iAmAthlete') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
