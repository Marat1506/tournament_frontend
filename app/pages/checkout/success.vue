<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()
if (import.meta.client) auth.hydrate()

const orderId = route.query.order_id as string
const guestEmailInput = ref((route.query.guest_email as string | undefined) || '')
const accessEmailError = ref('')
const accessChecking = ref(false)

const { data: order, error: orderError, refresh } = await useAsyncData(
  `order-${orderId}`,
  () => orderId ? api.getOrder(orderId, guestEmailInput.value.trim() || undefined) : Promise.resolve(null),
  { server: false },
)

watch(order, (o) => {
  if (o?.status === 'paid') {
    selection.clear()
  }
  else if (o?.status === 'failed' || o?.status === 'cancelled') {
    selection.clearPendingOrder()
  }
}, { immediate: true })

const downloadPhotos = computed(() => order.value?.download_photos ?? [])
const isPaid = computed(() => order.value?.status === 'paid')
const paymentEnded = computed(() => order.value?.status === 'failed' || order.value?.status === 'cancelled')
const confirming = ref(false)
const checkingStatus = ref(false)
const pollingTimedOut = ref(false)
const effectiveGuestEmail = computed(() => guestEmailInput.value.trim() || order.value?.guest_email || undefined)
const canRecoverGuestAccess = computed(() =>
  !auth.isLoggedIn && getApiErrorStatus(orderError.value) === 403,
)
const orderPageError = computed(() => {
  if (!orderId) return t('checkout.orderLinkInvalid')
  if (!orderError.value) return ''
  const status = getApiErrorStatus(orderError.value)
  if (status === 403) return t('checkout.orderAccessDenied')
  if (status === 404) return t('checkout.orderNotFound')
  return t(getCommonApiErrorKey(orderError.value) ?? 'checkout.orderLoadFailed')
})

const downloadingId = ref<string | null>(null)
const downloadError = ref('')

onMounted(async () => {
  if (!orderId) return
  if (orderError.value) return
  if (isPaid.value && downloadPhotos.value.length) return
  if (paymentEnded.value) return

  confirming.value = true
  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    try {
      await refresh()
    }
    catch {
      // webhook may still be in flight
    }
    if (isPaid.value && downloadPhotos.value.length) break
    if (isPaid.value || paymentEnded.value) break
  }
  confirming.value = false
  pollingTimedOut.value = !isPaid.value && !paymentEnded.value
})

async function checkStatus() {
  if (checkingStatus.value) return
  checkingStatus.value = true
  try {
    await refresh()
  }
  finally {
    checkingStatus.value = false
  }
}

async function retryGuestAccess() {
  const value = guestEmailInput.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    accessEmailError.value = t('cart.errorEmailInvalid')
    return
  }
  accessChecking.value = true
  accessEmailError.value = ''
  try {
    await refresh()
    if (!orderError.value) {
      await router.replace({ query: { ...route.query, guest_email: value } })
    }
  }
  finally {
    accessChecking.value = false
  }
}

async function downloadItem(item: { photo_id: string; original_filename?: string }) {
  if (downloadingId.value) return
  downloadingId.value = item.photo_id
  downloadError.value = ''
  try {
    await api.downloadPhoto(
      item.photo_id,
      item.original_filename,
      orderId,
      effectiveGuestEmail.value,
    )
  }
  catch (e: unknown) {
    const status = getApiErrorStatus(e)
    if (status === 401 || status === 403) {
      downloadError.value = t('checkout.downloadAccessDenied')
    }
    else if (status === 404) {
      downloadError.value = t('checkout.downloadNotFound')
    }
    else {
      downloadError.value = t(getCommonApiErrorKey(e) ?? 'checkout.downloadFailed')
    }
  }
  finally {
    downloadingId.value = null
  }
}

function photoLabel(item: { original_filename?: string }, index: number) {
  if (item.original_filename) return item.original_filename
  return t('checkout.photoNumber', { number: index + 1 })
}
</script>

<template>
  <div>
    <AppPageHeader :title="isPaid ? t('checkout.completedTitle') : paymentEnded ? t('checkout.paymentProblemTitle') : t('checkout.confirmationTitle')" />

    <div class="page-container space-y-5">
      <SearchStepper :current="4" :steps="4" :completed="isPaid" :third-label="t('cart.title')" tournament-to="/tournaments" />

      <div v-if="orderPageError" class="card space-y-4 p-5">
        <AppAlert type="error" :message="orderPageError" />
        <div v-if="canRecoverGuestAccess" class="space-y-3">
          <label for="order-access-email" class="block text-sm font-medium">
            {{ t('checkout.accessEmailLabel') }}
          </label>
          <input
            id="order-access-email"
            v-model="guestEmailInput"
            type="email"
            autocomplete="email"
            class="input-field"
            :class="{ 'input-field-error': accessEmailError }"
            placeholder="you@example.com"
            @input="accessEmailError = ''"
          >
          <p v-if="accessEmailError" class="field-error">{{ accessEmailError }}</p>
          <button type="button" class="btn-primary-solid" :disabled="accessChecking" @click="retryGuestAccess">
            <span v-if="accessChecking" class="loading-spinner" aria-hidden="true" />
            {{ accessChecking ? t('checkout.checkingAccess') : t('checkout.openOrder') }}
          </button>
        </div>
        <NuxtLink to="/support" class="btn-secondary justify-center">{{ t('common.help') }}</NuxtLink>
      </div>

      <template v-else>
      <div class="text-center">
        <div
          class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
          :class="isPaid ? 'bg-green-500/20 text-green-400' : paymentEnded ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'"
        >
          <AppIcon :name="isPaid ? 'check' : 'clock'" class="h-10 w-10" />
        </div>
        <h1 class="text-xl font-bold">
          {{ isPaid ? t('cart.paymentSuccess') : paymentEnded ? t('checkout.paymentFailedTitle') : t('checkout.awaitingTitle') }}
        </h1>
        <p class="mt-2 text-gray-400">
          {{ isPaid ? t('cart.thanks') : paymentEnded ? t('checkout.paymentFailedHint') : t('checkout.awaitingHint') }}
        </p>
      </div>

      <div v-if="order" class="card space-y-3 p-4 text-left">
        <h2 class="font-semibold">{{ t('cart.orderDetails') }}</h2>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ t('cart.photosBought') }}</span>
          <span>{{ downloadPhotos.length || '—' }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ t('cart.orderAmount') }}</span>
          <span>${{ order.total }}</span>
        </div>
        <div class="flex items-center justify-between border-t border-white/10 pt-3">
          <span class="font-semibold">{{ isPaid ? t('cart.totalPaid') : t('cart.total') }}</span>
          <span class="text-lg font-bold text-brand-400">${{ order.total }}</span>
        </div>
      </div>

      <p v-if="confirming && !downloadPhotos.length" class="text-center text-sm text-gray-400">
        {{ t('checkout.confirmingPayment') }}
      </p>
      <p v-else-if="!isPaid && !paymentEnded" class="text-center text-sm text-amber-300">
        {{ auth.isLoggedIn ? t('checkout.paymentPendingAccount') : t('checkout.paymentPendingGuest') }}
      </p>
      <button
        v-if="!isPaid && !paymentEnded && !confirming"
        type="button"
        class="btn-secondary justify-center"
        :disabled="checkingStatus"
        @click="checkStatus"
      >
        <span v-if="checkingStatus" class="loading-spinner" aria-hidden="true" />
        {{ checkingStatus ? t('checkout.checkingStatus') : t('checkout.checkStatus') }}
      </button>
      <NuxtLink
        v-if="!isPaid && !paymentEnded && pollingTimedOut"
        to="/support"
        class="block text-center text-sm font-medium text-brand-400"
      >
        {{ t('checkout.paymentSupport') }}
      </NuxtLink>
      <NuxtLink v-if="paymentEnded" to="/cart" class="btn-primary-solid justify-center">
        {{ t('checkout.returnToCart') }}
      </NuxtLink>

      <div v-if="isPaid" class="space-y-3">
        <h2 class="font-semibold">{{ t('cart.whatsNext') }}</h2>

        <div class="card p-4">
          <div class="flex items-center gap-3">
            <div class="icon-tile">
              <AppIcon name="download" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ t('cart.downloadTitle') }}</div>
              <div class="text-sm text-gray-500">{{ t('cart.downloadHint') }}</div>
            </div>
          </div>

          <div v-if="downloadPhotos.length" class="mt-4 space-y-2">
            <button
              v-for="(item, index) in downloadPhotos"
              :key="item.photo_id"
              type="button"
              class="btn-secondary w-full justify-between px-4"
              :disabled="downloadingId === item.photo_id"
              @click="downloadItem(item)"
            >
              <span class="truncate pr-3 text-left">{{ photoLabel(item, index) }}</span>
              <span class="shrink-0 text-brand-400">
                {{ downloadingId === item.photo_id ? t('checkout.downloading') : t('checkout.download') }}
              </span>
            </button>
          </div>
          <div v-else class="mt-3 space-y-3">
            <p class="text-sm text-gray-500">{{ t('checkout.preparingDownloads') }}</p>
            <button type="button" class="btn-secondary justify-center" :disabled="checkingStatus" @click="checkStatus">
              <span v-if="checkingStatus" class="loading-spinner" aria-hidden="true" />
              {{ checkingStatus ? t('checkout.checkingStatus') : t('checkout.refreshDownloads') }}
            </button>
            <NuxtLink to="/support" class="block text-center text-sm font-medium text-brand-400">
              {{ t('common.help') }}
            </NuxtLink>
          </div>
          <AppAlert v-if="downloadError" class="mt-3" type="error" :message="downloadError" />
        </div>

        <div v-if="!auth.isLoggedIn && effectiveGuestEmail" class="card flex items-start gap-3 p-4">
          <div class="icon-tile">
            <AppIcon name="mail" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t('checkout.emailDeliveryTitle') }}</div>
            <div class="mt-1 text-sm text-gray-400">
              {{ t('checkout.emailDeliveryHint', { email: effectiveGuestEmail }) }}
            </div>
            <NuxtLink to="/support" class="mt-2 inline-block text-sm font-medium text-brand-400">
              {{ t('checkout.emailHelp') }}
            </NuxtLink>
          </div>
        </div>

        <div v-if="!auth.isLoggedIn" class="cabinet-row">
          <div class="icon-tile">
            <AppIcon name="heart" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t('cart.favTitle') }}</div>
            <div class="text-sm text-gray-500">{{ t('cart.favHint') }}</div>
          </div>
          <NuxtLink to="/favorites" class="btn-outline shrink-0">{{ t('cart.favBtn') }}</NuxtLink>
        </div>

        <div v-else class="cabinet-row">
          <div class="icon-tile">
            <AppIcon name="photos" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t('checkout.purchaseSavedTitle') }}</div>
            <div class="text-sm text-gray-500">{{ t('checkout.purchaseSavedHint') }}</div>
          </div>
          <NuxtLink to="/profile/orders" class="btn-outline shrink-0">{{ t('checkout.myPurchases') }}</NuxtLink>
        </div>
      </div>

      </template>

      <NuxtLink to="/" class="btn-primary-solid gap-2">
        <AppIcon name="home" class="h-5 w-5" />
        {{ t('cart.backHome') }}
      </NuxtLink>
    </div>
  </div>
</template>
