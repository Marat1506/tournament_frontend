<script setup lang="ts">
definePageMeta({ middleware: 'photographer-auth' })

const { t } = useI18n()
const api = useApi()
const route = useRoute()
const toast = useToast()

const country = ref('')
const loading = ref(false)
const actionError = ref('')

const { data, pending, error: loadError, refresh } = await useAsyncData('photographer-payouts', () => api.getPayouts())

watch(data, (status) => {
  if (status?.country) country.value = status.country
}, { immediate: true })

onMounted(async () => {
  const flag = route.query.onboarding
  if (flag === 'return' || flag === 'refresh') {
    await refresh()
    if (flag === 'refresh' && data.value && !data.value.can_receive_payments && data.value.stripe_configured) {
      await startOnboarding()
    }
  }
})

const justReturned = computed(() => route.query.onboarding === 'return')

const needsCountry = computed(() => {
  const status = data.value?.status
  return !data.value?.country && (status === 'not_started' || status === 'disabled')
})

const primaryLabel = computed(() => {
  const status = data.value?.status
  if (status === 'onboarding' || status === 'restricted') return t('photographer.payoutsContinue')
  if (status === 'disabled') return t('photographer.payoutsReconnect')
  return t('photographer.payoutsConnect')
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

async function openDashboard() {
  loading.value = true
  actionError.value = ''
  try {
    const result = await api.getPayoutLoginLink()
    if (import.meta.client && result.url) {
      window.location.href = result.url
    }
  }
  catch {
    actionError.value = t('photographer.payoutsLoginFailed')
    toast.error(t('photographer.payoutsLoginFailed'))
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
        <button class="btn-primary-solid" @click="refresh()">{{ t('common.retry') }}</button>
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
          <AppAlert v-if="justReturned && !data.can_receive_payments" type="info" :message="t('photographer.payoutsReturned')" />

          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('photographer.payoutsStatusLabel') }}</p>
            <p class="mt-1 text-base font-semibold" :class="data.can_receive_payments ? 'text-green-400' : 'text-amber-400'">
              {{ t(`photographer.payoutsStatus.${data.status}`) }}
            </p>
            <p class="mt-1 text-sm text-gray-400">{{ t(`photographer.payoutsStatusHint.${data.status}`) }}</p>
          </div>

          <label v-if="needsCountry" class="block space-y-2">
            <span class="text-sm font-medium">{{ t('photographer.payoutsCountry') }}</span>
            <select v-model="country" class="input-field">
              <option value="" disabled>{{ t('photographer.payoutsCountryPlaceholder') }}</option>
              <option v-for="item in data.countries" :key="item.code" :value="item.code">
                {{ item.name }}
              </option>
            </select>
            <span class="block text-xs text-gray-500">{{ t('photographer.payoutsCountryHint') }}</span>
          </label>
          <p v-else-if="data.country" class="text-sm text-gray-400">
            {{ t('photographer.payoutsCountryLocked', { country: data.country }) }}
          </p>

          <AppAlert v-if="actionError" type="error" :message="actionError" />

          <button
            v-if="!data.can_receive_payments"
            class="btn-primary-solid w-full"
            :disabled="loading || (needsCountry && !country)"
            @click="startOnboarding"
          >
            {{ loading ? t('photographer.payoutsRedirecting') : primaryLabel }}
          </button>

          <button
            v-if="data.details_submitted"
            class="btn-secondary w-full"
            :disabled="loading"
            @click="openDashboard"
          >
            {{ t('photographer.payoutsOpenStripe') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
