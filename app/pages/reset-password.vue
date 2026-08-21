<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const api = useApi()
const route = useRoute()

const email = ref((route.query.email as string) || '')
const code = ref('')
const password = ref('')
const error = ref('')
const notice = ref('')
const loading = ref(false)
const resending = ref(false)
const cooldown = ref(0)
const done = ref(false)

const loginLink = computed(() =>
  route.query.role === 'photographer' ? '/photographer/login' : '/login',
)

const canSubmit = computed(() =>
  !!email.value.trim()
  && /^\d{4}$/.test(code.value)
  && password.value.length >= 8
  && !loading.value,
)

const canResend = computed(() =>
  !resending.value && cooldown.value <= 0 && !loading.value,
)

let cooldownTimer: ReturnType<typeof setInterval> | undefined

function startCooldown(seconds = 60) {
  cooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = undefined
    }
  }, 1000)
}

onMounted(() => {
  if (email.value.trim()) startCooldown()
})

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

function onCodeInput(e: Event) {
  const input = e.target as HTMLInputElement
  code.value = input.value.replace(/\D/g, '').slice(0, 4)
}

async function resendCode() {
  if (!canResend.value) return
  const target = email.value.trim()
  if (!target) {
    error.value = t('auth.resetEmailRequired')
    notice.value = ''
    return
  }
  resending.value = true
  error.value = ''
  notice.value = ''
  try {
    await api.forgotPassword(target)
    notice.value = t('auth.resetResent')
    startCooldown()
  }
  catch {
    error.value = t('auth.resetSendFailed')
  }
  finally {
    resending.value = false
  }
}

async function submit() {
  if (!canSubmit.value) return
  error.value = ''
  notice.value = ''
  loading.value = true
  try {
    await api.resetPassword(email.value.trim(), code.value, password.value)
    done.value = true
  }
  catch (e: unknown) {
    error.value = t(mapApiError(e, [
      { match: 'password must be at least 8', key: 'auth.weakPassword' },
      { match: 'invalid or expired', key: 'auth.resetCodeError' },
    ], 'auth.resetFailed'))
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('auth.resetTitle')">
      <template #left>
        <NuxtLink to="/forgot-password" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>
    <div class="page-container max-w-md">
      <div v-if="done" class="card space-y-4 p-6 text-center">
        <p class="text-sm text-green-400">{{ t('auth.resetSuccess') }}</p>
        <NuxtLink :to="loginLink" class="btn-primary-solid block">{{ t('auth.loginBtn') }}</NuxtLink>
      </div>
      <form v-else class="space-y-4" autocomplete="off" @submit.prevent="submit">
        <p class="text-sm text-gray-400">{{ t('auth.resetHint') }}</p>
        <input
          v-model="email"
          type="email"
          name="reset-email"
          class="input-field"
          autocomplete="username"
          :placeholder="t('auth.email')"
          required
        >
        <input
          :value="code"
          type="text"
          name="reset-code"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="4"
          class="input-field text-center text-2xl font-bold tracking-[0.5em]"
          :placeholder="t('confirmEmail.codePlaceholder')"
          @input="onCodeInput"
        >
        <input
          v-model="password"
          type="password"
          name="new-password"
          class="input-field"
          autocomplete="new-password"
          :placeholder="t('auth.newPassword')"
          minlength="8"
          required
        >
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
        <p v-else-if="notice" class="text-sm text-green-400">{{ notice }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="!canSubmit">
          {{ loading ? t('auth.resetting') : t('auth.resetBtn') }}
        </button>
        <button
          type="button"
          class="btn-secondary w-full justify-center"
          :disabled="!canResend"
          @click="resendCode"
        >
          {{
            resending
              ? t('auth.resetSending')
              : cooldown > 0
                ? t('confirmEmail.resendWait', { seconds: cooldown })
                : t('auth.resetResend')
          }}
        </button>
      </form>
    </div>
  </div>
</template>
