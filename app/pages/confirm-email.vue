<script setup lang="ts">
definePageMeta({})

const PENDING_EMAIL_KEY = 'bjj_pending_verify_email'

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const { resend, sending, sent, error: resendError, cooldown } = useResendVerification()

const isPhotographer = computed(() => route.query.role === 'photographer')

const pendingEmail = ref('')
const code = ref('')
const verifying = ref(false)
const verifyError = ref('')

const canSubmit = computed(() => /^\d{4}$/.test(code.value) && !verifying.value && !!pendingEmail.value)

const backLink = computed(() =>
  isPhotographer.value ? '/photographer/login' : '/login',
)

onMounted(async () => {
  pendingEmail.value = (
    (route.query.email as string)
    || auth.user?.email
    || (import.meta.client ? sessionStorage.getItem(PENDING_EMAIL_KEY) : null)
    || ''
  ).trim()

  if (!pendingEmail.value) {
    const login = isPhotographer.value ? '/photographer/login' : '/login'
    await router.replace(`${login}?redirect=/confirm-email${isPhotographer.value ? '&role=photographer' : ''}`)
    return
  }

  if (import.meta.client) {
    sessionStorage.setItem(PENDING_EMAIL_KEY, pendingEmail.value)
  }

  if (auth.user?.email_verified) {
    if (auth.user.role === 'photographer') {
      await router.replace('/photographer/pending')
    }
    else {
      await router.replace('/profile')
    }
    return
  }

  await resend(pendingEmail.value)
})

async function submitCode() {
  if (!canSubmit.value) return
  verifying.value = true
  verifyError.value = ''
  try {
    const resp = await api.verifyRegistration(pendingEmail.value, code.value)
    if (import.meta.client) {
      sessionStorage.removeItem(PENDING_EMAIL_KEY)
    }

    if (resp.pending_approval || resp.user.role === 'photographer') {
      auth.logout()
      await router.push('/photographer/pending')
      return
    }

    if (resp.access_token) {
      auth.setSession({
        access_token: resp.access_token,
        refresh_token: resp.refresh_token!,
        user: resp.user,
      })
      const favorites = useFavoritesStore()
      favorites.synced = false
      favorites.syncFromServer()
      await router.push('/profile')
    }
  }
  catch {
    verifyError.value = t('confirmEmail.codeError')
    code.value = ''
  }
  finally {
    verifying.value = false
  }
}

function onCodeInput(e: Event) {
  const input = e.target as HTMLInputElement
  code.value = input.value.replace(/\D/g, '').slice(0, 4)
}

async function logout() {
  auth.logout()
  if (import.meta.client) {
    sessionStorage.removeItem(PENDING_EMAIL_KEY)
  }
  await router.push(isPhotographer.value ? '/photographer/login' : '/')
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('confirmEmail.title')">
      <template #left>
        <NuxtLink :to="backLink" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container max-w-md">
      <div class="card space-y-5 p-6 text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
          <AppIcon name="mail" class="h-8 w-8" />
        </div>

        <div>
          <h1 class="text-lg font-bold">{{ t('confirmEmail.heading') }}</h1>
          <p class="mt-2 text-sm text-gray-400">
            {{ isPhotographer ? t('photographer.confirmEmailHint') : t('confirmEmail.hint') }}
          </p>
          <p v-if="pendingEmail" class="mt-3 text-sm font-medium text-brand-400">{{ pendingEmail }}</p>
        </div>

        <form class="space-y-4" @submit.prevent="submitCode">
          <div>
            <label for="verify-code" class="mb-2 block text-sm text-gray-400">{{ t('confirmEmail.codeLabel') }}</label>
            <input
              id="verify-code"
              :value="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="4"
              class="input-field text-center text-2xl font-bold tracking-[0.5em]"
              :placeholder="t('confirmEmail.codePlaceholder')"
              @input="onCodeInput"
            >
          </div>

          <p v-if="verifyError" class="text-sm text-red-400">{{ verifyError }}</p>
          <p v-else-if="sent" class="text-sm text-green-400">{{ t('confirmEmail.sent') }}</p>
          <p v-if="resendError" class="text-sm text-red-400">{{ resendError }}</p>

          <button type="submit" class="btn-primary-solid w-full" :disabled="!canSubmit">
            {{ verifying ? t('confirmEmail.verifying') : t('confirmEmail.confirmBtn') }}
          </button>
        </form>

        <button
          type="button"
          class="btn-secondary w-full"
          :disabled="sending || cooldown > 0 || !pendingEmail"
          @click="resend(pendingEmail)"
        >
          {{
            sending
              ? t('confirmEmail.sending')
              : cooldown > 0
                ? t('confirmEmail.resendWait', { seconds: cooldown })
                : t('confirmEmail.resend')
          }}
        </button>

        <button type="button" class="text-sm text-gray-500" @click="logout">
          {{ t('confirmEmail.logout') }}
        </button>
      </div>
    </div>
  </div>
</template>
