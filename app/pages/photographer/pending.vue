<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()

const loading = ref(true)

onMounted(async () => {
  if (auth.accessToken && !auth.user) {
    try {
      auth.setUser(await api.me())
    } catch {
      auth.logout()
    }
  }

  if (auth.isApprovedPhotographer) {
    await router.replace('/photographer/dashboard')
    return
  }

  loading.value = false
})

async function logout() {
  auth.logout()
  await router.push('/photographer/login')
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.registerTitle')" />
    <div class="page-container max-w-md">
      <div v-if="loading" class="card h-40 animate-pulse bg-white/10" />

      <div v-else class="card space-y-4 p-6 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
          <AppIcon name="check" class="h-7 w-7" />
        </div>

        <template v-if="auth.isPhotographer && auth.user?.status === 'pending'">
          <h2 class="text-lg font-semibold">{{ t('photographer.pendingTitle') }}</h2>
          <p class="text-sm text-gray-400">{{ t('photographer.pendingApproval') }}</p>
          <p v-if="auth.user?.email" class="text-sm font-medium text-brand-400">{{ auth.user.email }}</p>
        </template>

        <template v-else>
          <h2 class="text-lg font-semibold">{{ t('photographer.applicationSubmitted') }}</h2>
          <p class="text-sm text-gray-400">{{ t('photographer.applicationSubmittedHint') }}</p>
        </template>

        <NuxtLink to="/photographer/login" class="btn-primary-solid w-full">
          {{ t('photographer.loginBtn') }}
        </NuxtLink>

        <button
          v-if="auth.isLoggedIn"
          type="button"
          class="w-full text-sm text-gray-500"
          @click="logout"
        >
          {{ t('photographer.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>
