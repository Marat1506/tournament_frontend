import type { AuthResponse } from '~/types'

const PENDING_EMAIL_KEY = 'bjj_pending_verify_email'

export function useClientAuthRedirect() {
  const router = useRouter()
  const route = useRoute()
  const auth = useAuthStore()

  function needsEmailConfirmation(user: AuthResponse['user']) {
    return user.role === 'client' && !user.email_verified
  }

  async function afterClientSession(resp: AuthResponse, fallback = '/profile') {
    if (!resp.access_token) {
      if (import.meta.client && resp.user.email) {
        sessionStorage.setItem(PENDING_EMAIL_KEY, resp.user.email)
      }
      await router.push('/confirm-email')
      return
    }
    auth.setSession({
      access_token: resp.access_token,
      refresh_token: resp.refresh_token!,
      user: resp.user,
    })
    if (needsEmailConfirmation(resp.user)) {
      await router.push('/confirm-email')
      return
    }
    const redirect = (route.query.redirect as string) || fallback
    await router.push(redirect)
  }

  return { needsEmailConfirmation, afterClientSession }
}

export function useResendVerification() {
  const api = useApi()
  const auth = useAuthStore()
  const { t } = useI18n()

  const sending = ref(false)
  const sent = ref(false)
  const error = ref('')
  const cooldown = ref(0)

  let timer: ReturnType<typeof setInterval> | null = null

  function startCooldown(seconds = 60) {
    cooldown.value = seconds
    if (timer) clearInterval(timer)
    timer = setInterval(() => {
      cooldown.value -= 1
      if (cooldown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  async function resend(email?: string) {
    if (sending.value || cooldown.value > 0) return
    sending.value = true
    error.value = ''
    sent.value = false
    try {
      const targetEmail = email?.trim()
        || (import.meta.client ? sessionStorage.getItem(PENDING_EMAIL_KEY) : null)
        || auth.user?.email
      if (targetEmail) {
        await api.resendRegistrationCode(targetEmail)
      }
      else {
        await api.resendVerification()
      }
      sent.value = true
      startCooldown()
    }
    catch {
      error.value = t('confirmEmail.resendError')
    }
    finally {
      sending.value = false
    }
  }

  return { sending, sent, error, cooldown, resend }
}
