<script setup lang="ts">
import type { PayoutStatus } from '~/types'

definePageMeta({ middleware: 'photographer-auth', ssr: false })

const { t } = useI18n()
const api = useApi()
const route = useRoute()
const toast = useToast()
const auth = useAuthStore()
if (import.meta.client) auth.hydrate()

const country = ref('')
const loading = ref(false)
const actionError = ref('')
const data = ref<PayoutStatus | null>(null)
const pending = ref(true)
const loadError = ref(false)
const stripeTabOpened = ref(false)
const pollExhausted = ref(false)

const POLL_MS = 8000
const POLL_MAX = 24
let pollTimer: ReturnType<typeof setInterval> | undefined
let pollCount = 0

async function loadPayouts(silent = false) {
  if (import.meta.client) auth.hydrate()
  if (!silent) {
    pending.value = true
    loadError.value = false
  }
  try {
    data.value = await api.getPayouts()
    if (data.value?.country) country.value = data.value.country
  }
  catch {
    if (!silent) loadError.value = true
  }
  finally {
    if (!silent) pending.value = false
  }
}

const justReturned = computed(() => route.query.onboarding === 'return')

const needsCountry = computed(() => {
  const status = data.value?.status
  return !data.value?.country && (status === 'not_started' || status === 'disabled')
})

const preparingDashboard = computed(() =>
  !!data.value?.stripe_configured
  && !!data.value.details_submitted
  && !data.value.dashboard_ready,
)

const showContinue = computed(() =>
  !!data.value?.stripe_configured
  && !data.value.details_submitted
  && !data.value.can_receive_payments,
)

const showOpenDashboard = computed(() => !!data.value?.details_submitted)

const primaryLabel = computed(() => {
  const status = data.value?.status
  if (status === 'onboarding' || status === 'restricted') return t('photographer.payoutsContinue')
  if (status === 'disabled') return t('photographer.payoutsReconnect')
  return t('photographer.payoutsConnect')
})

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

function startPolling() {
  stopPolling()
  pollCount = 0
  pollExhausted.value = false
  if (!preparingDashboard.value) return
  pollTimer = setInterval(async () => {
    pollCount += 1
    await loadPayouts(true)
    if (data.value?.dashboard_ready) {
      stopPolling()
      return
    }
    if (pollCount >= POLL_MAX) {
      stopPolling()
      pollExhausted.value = true
    }
  }, POLL_MS)
}

watch(preparingDashboard, (preparing) => {
  if (preparing) startPolling()
  else stopPolling()
})

onMounted(async () => {
  await loadPayouts()
  if (preparingDashboard.value) startPolling()
})

onUnmounted(() => {
  stopPolling()
})

async function startOnboarding() {
  if (!data.value?.stripe_configured) return
  if (needsCountry.value && !country.value) {
    actionError.value = t('photographer.payoutsCountryRequired')
    return
  }
  loading.value = true
  actionError.value = ''
  try {
    const result = await api.startPayoutOnboarding(country.value || undefined)
    if (import.meta.client && result.url) {
      window.location.href = result.url
    }
  }
  catch (e: unknown) {
    const key = mapApiError(e, [
      { match: 'country_required', key: 'photographer.payoutsCountryRequired' },
      { match: 'country_not_supported', key: 'photographer.payoutsCountryUnsupported' },
      { match: 'stripe_not_configured', key: 'photographer.payoutsNotConfigured' },
      { match: 'account_create_failed', key: 'photographer.payoutsConnectFailed' },
    ], 'photographer.payoutsConnectFailed')
    actionError.value = t(key)
    toast.error(t(key))
  }
  finally {
    loading.value = false
  }
}

function openStripeUrl(url: string) {
  if (!import.meta.client) return
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) {
    window.location.href = url
    return
  }
  stripeTabOpened.value = true
}

async function openDashboard() {
  if (preparingDashboard.value) return
  loading.value = true
  actionError.value = ''
  try {
    const result = await api.getPayoutLoginLink()
    if (result.url) openStripeUrl(result.url)
  }
  catch {
    if (data.value?.details_submitted) {
      data.value = { ...data.value, dashboard_ready: false }
      startPolling()
    }
    else {
      actionError.value = t('photographer.payoutsLoginFailed')
      toast.error(t('photographer.payoutsLoginFailed'))
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.payoutsTitle')">
      <template #left>
        <NuxtLink to="/photographer/dashboard" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container max-w-md space-y-4">
      <div v-if="pending" class="card h-40 animate-pulse bg-white/10" />

      <div v-else-if="loadError" class="card space-y-3 p-6 text-center">
        <AppAlert type="error" :message="t('photographer.payoutsLoadFailed')" />
        <button class="btn-primary-solid" @click="loadPayouts()">{{ t('common.retry') }}</button>
      </div>

      <template v-else-if="data">
        <div class="card space-y-3 p-5">
          <p class="text-sm leading-relaxed text-gray-400">{{ t('photographer.payoutsIntro') }}</p>
          <p class="text-sm text-gray-300">
            {{ t('photographer.payoutsFee', { percent: data.platform_fee_percent }) }}
          </p>
        </div>

        <div v-if="!data.stripe_configured" class="card p-5">
          <AppAlert type="info" :message="t('photographer.payoutsNotConfigured')" />
        </div>

        <div v-else class="card space-y-4 p-5">
          <AppAlert v-if="justReturned && !data.can_receive_payments && !data.details_submitted" type="info" :message="t('photographer.payoutsReturned')" />
          <AppAlert v-if="stripeTabOpened" type="info" :message="t('photographer.payoutsOpenedTab')" />

          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('photographer.payoutsStatusLabel') }}</p>
            <p class="mt-1 text-base font-semibold" :class="data.can_receive_payments ? 'text-green-400' : 'text-amber-400'">
              {{ t(`photographer.payoutsStatus.${data.status}`) }}
            </p>
            <p class="mt-1 text-sm text-gray-400">{{ t(`photographer.payoutsStatusHint.${data.status}`) }}</p>
          </div>

          <p v-if="preparingDashboard" class="text-sm leading-relaxed text-gray-300">
            {{ t('photographer.payoutsPreparingHint') }}
          </p>

          <label v-if="needsCountry" class="block space-y-2">
            <span class="text-sm font-medium">{{ t('photographer.payoutsCountry') }}</span>
            <select
              v-model="country"
              class="input-field"
              :class="{ 'input-field-error': actionError && !country }"
              @change="actionError = ''"
            >
              <option value="" disabled>{{ t('photographer.payoutsCountryPlaceholder') }}</option>
              <option v-for="item in data.countries" :key="item.code" :value="item.code">
                {{ item.name }}
              </option>
            </select>
            <span class="block text-xs text-gray-500">{{ t('photographer.payoutsCountryHint') }}</span>
            <span v-if="actionError && !country" class="field-error">
              {{ t('photographer.payoutsCountryRequired') }}
            </span>
          </label>
          <p v-else-if="data.country" class="text-sm text-gray-400">
            {{ t('photographer.payoutsCountryLocked', { country: data.country }) }}
          </p>

          <AppAlert v-if="actionError" type="error" :message="actionError" />

          <button
            v-if="showContinue"
            class="btn-primary-solid w-full"
            :disabled="loading"
            @click="startOnboarding"
          >
            {{ loading ? t('photographer.payoutsRedirecting') : primaryLabel }}
          </button>

          <button
            v-if="showOpenDashboard && preparingDashboard"
            class="relative w-full overflow-hidden rounded-2xl bg-[#151b28] px-4 py-3.5 text-base font-semibold text-gray-300 ring-1 ring-white/10"
            disabled
          >
            {{ t('photographer.payoutsPreparingBtn') }}
            <span class="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-white/10">
              <span class="block h-full w-1/2 animate-pulse bg-brand-500" />
            </span>
          </button>

          <button
            v-else-if="showOpenDashboard"
            class="btn-secondary w-full"
            :disabled="loading"
            @click="openDashboard"
          >
            {{ loading ? t('photographer.payoutsRedirecting') : t('photographer.payoutsOpenStripe') }}
          </button>

          <button
            v-if="preparingDashboard && pollExhausted"
            type="button"
            class="btn-secondary w-full justify-center"
            @click="loadPayouts().then(() => { if (preparingDashboard) startPolling() })"
          >
            {{ t('photographer.payoutsRefreshStatus') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
