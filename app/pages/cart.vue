<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()

if (import.meta.client) selection.hydrate()

const tournamentId = computed(() =>
  (route.query.tournament_id as string | undefined) || selection.tournamentId,
)
const guestEmail = ref(selection.guestEmail)
const guestEmailInput = ref<HTMLInputElement | null>(null)
const emailTouched = ref(false)
const loading = ref(false)
const error = ref('')
const step = computed(() => (hasItems.value ? 4 : 3))

const hasItems = computed(() => selection.items.length > 0 || !!selection.bundle)
const total = computed(() => selection.total)
const count = computed(() => selection.count)
const paymentCancelled = ref(route.query.payment === 'cancelled')
const checkoutSignature = computed(() => JSON.stringify({
  tournamentId: tournamentId.value,
  email: auth.isLoggedIn ? '' : guestEmail.value.trim().toLowerCase(),
  bundle: selection.bundle
    ? { athleteId: selection.bundle.athleteId, price: selection.bundle.price }
    : null,
  items: selection.items.map(item => item.id).sort(),
}))
const guestEmailError = computed(() => {
  if (auth.isLoggedIn || !emailTouched.value) return ''
  const value = guestEmail.value.trim()
  if (!value) return t('cart.errorEmail')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('cart.errorEmailInvalid')
  return ''
})

const { data: tournament } = await useAsyncData(
  () => `cart-tournament-${tournamentId.value || 'none'}`,
  async () => {
    if (!tournamentId.value) return null
    const list = await api.getTournaments()
    return list.data?.find(item => item.id === tournamentId.value) || null
  },
  { server: false, watch: [tournamentId] },
)

async function checkout() {
  if (loading.value) return
  if (!hasItems.value || !tournamentId.value) {
    error.value = t('cart.errorEmpty')
    return
  }
  if (!auth.isLoggedIn) {
    emailTouched.value = true
    await nextTick()
    if (guestEmailError.value) {
      guestEmailInput.value?.focus()
      return
    }
  }
  loading.value = true
  error.value = ''
  try {
    const items = selection.bundle
      ? [{ type: 'bundle', athlete_id: selection.bundle.athleteId }]
      : selection.items.map(p => ({ type: 'single', photo_id: p.id }))

    const signature = checkoutSignature.value
    let orderId = selection.pendingSignature === signature ? selection.pendingOrderId : ''
    if (!orderId) {
      const order = await api.createOrder({
        tournament_id: tournamentId.value,
        guest_email: auth.isLoggedIn ? undefined : guestEmail.value.trim(),
        items,
      })
      orderId = order.id
      selection.setPendingOrder(order.id, signature)
    }
    const result = await api.checkout(orderId, auth.isLoggedIn ? undefined : guestEmail.value.trim())
    if (result.dev_mode) {
      await navigateTo(result.url)
    }
    else {
      window.location.href = result.url
    }
  }
  catch (e: unknown) {
    const key = mapApiError(e, [
      { match: 'cart is empty', key: 'cart.errorEmpty' },
      { match: 'guest_email', key: 'cart.errorEmail' },
      { match: 'photo not found', key: 'cart.errorPhotoUnavailable' },
      { match: 'not available', key: 'cart.errorPhotoUnavailable' },
      { match: 'bundle requires', key: 'cart.errorBundleMin' },
      { match: 'payment method', key: 'cart.errorPayment' },
      { match: 'stripe session', key: 'cart.errorPayment' },
      { match: 'order is not pending', key: 'cart.errorCheckoutRetry' },
      { match: 'payouts_not_ready', key: 'cart.errorPayouts' },
    ], 'cart.errorCheckout')
    if (key === 'cart.errorCheckoutRetry') selection.clearPendingOrder()
    error.value = !getApiErrorStatus(e) ? t('errors.network') : t(key)
  }
  finally {
    loading.value = false
  }
}

watch(guestEmail, value => selection.setGuestEmail(value))

onMounted(() => {
  if (!paymentCancelled.value) return
  const query = { ...route.query }
  delete query.payment
  router.replace({ query })
})

function removePhoto(id: string) {
  const photo = selection.items.find(p => p.id === id)
  if (photo) selection.toggle(photo)
}

const backToPhotos = computed(() => {
  if (selection.returnPath) return selection.returnPath
  if (tournament.value?.slug) return `/tournaments/${tournament.value.slug}/photos`
  return '/tournaments'
})
</script>

<template>
  <div class="pb-24">
    <AppPageHeader :title="t('cart.checkoutTitle')">
      <template #left>
        <NuxtLink :to="backToPhotos" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4">
      <SearchStepper :current="step" :steps="4" :third-label="t('cart.title')" tournament-to="/tournaments" />

      <AppAlert v-if="paymentCancelled" type="info" :message="t('cart.paymentCancelled')" />

      <div v-if="!hasItems" class="card p-8 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-gray-400">
          <AppIcon name="cart" class="h-6 w-6" />
        </div>
        <p class="mt-3 text-gray-400">{{ t('cart.empty') }}</p>
        <NuxtLink :to="backToPhotos" class="btn-outline mt-4">
          {{ t('cart.findPhotos') }}
        </NuxtLink>
      </div>

      <template v-else>
        <div v-if="tournament" class="card flex items-center gap-3 p-3">
          <div class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
            <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate font-semibold">{{ tournament.name }}</div>
            <div class="text-xs text-gray-500">{{ tournament.location }}</div>
          </div>
          <NuxtLink to="/tournaments" class="text-sm font-medium text-brand-400">
            {{ t('search.changeTournament') }}
          </NuxtLink>
        </div>

        <div>
          <h2 class="mb-3 font-semibold">{{ t('cart.selectedPhotos', { count }) }}</h2>
          <div v-if="selection.bundle" class="card p-4">
            <div class="font-medium">{{ t('cart.bundle', { name: selection.bundle.athleteName }) }}</div>
            <div class="text-sm text-gray-500">{{ t('cart.bundleHint') }} · ${{ selection.bundle.price }}</div>
            <button class="mt-2 text-sm text-red-400" @click="selection.clear()">{{ t('cart.remove') }}</button>
          </div>
          <div v-else class="grid grid-cols-5 gap-2">
            <div
              v-for="photo in selection.items"
              :key="photo.id"
              class="relative overflow-hidden rounded-xl bg-white/10"
            >
              <div class="aspect-square">
                <AppImage :src="photo.thumbnail_url || photo.preview_url" aspect="square" />
              </div>
              <button
                type="button"
                class="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-bl-xl bg-black/75 text-lg transition active:scale-90"
                :aria-label="t('cart.removePhoto')"
                @click="removePhoto(photo.id)"
              >
                ×
              </button>
            </div>
          </div>
          <NuxtLink :to="backToPhotos" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-400">
            <AppIcon name="plus" class="h-4 w-4" />
            {{ t('cart.addMore') }}
          </NuxtLink>
        </div>

        <div v-if="!auth.isLoggedIn" class="card p-4">
          <label for="guest-email" class="mb-2 block font-semibold">{{ t('cart.guestEmail') }}</label>
          <input
            id="guest-email"
            ref="guestEmailInput"
            v-model="guestEmail"
            type="email"
            autocomplete="email"
            inputmode="email"
            class="input-field"
            :class="{ 'input-field-error': guestEmailError }"
            placeholder="you@example.com"
            :aria-invalid="!!guestEmailError"
            :aria-describedby="guestEmailError ? 'guest-email-error' : 'guest-email-hint'"
            required
            @blur="emailTouched = true"
            @input="error = ''"
          >
          <p v-if="guestEmailError" id="guest-email-error" class="field-error">{{ guestEmailError }}</p>
          <p v-else id="guest-email-hint" class="mt-2 text-sm leading-relaxed text-gray-400">
            {{ t('cart.guestEmailHint') }}
            <NuxtLink to="/login?redirect=/cart" class="font-medium text-brand-400">{{ t('cart.signIn') }}</NuxtLink>
            {{ t('cart.or') }}
            <NuxtLink to="/register?redirect=/cart" class="font-medium text-brand-400">{{ t('cart.createAccount') }}</NuxtLink>
          </p>
        </div>
        <AppAlert v-else type="info" :message="t('cart.accountPurchaseHint')" />

        <div class="card space-y-3 p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-400">{{ t('search.photosLine', { count }) }}</span>
            <span class="font-semibold">${{ total.toFixed(2) }}</span>
          </div>
          <div class="border-t border-white/10 pt-3">
            <div class="flex items-center justify-between">
              <span class="font-semibold">{{ t('search.totalToPay') }}</span>
              <span class="text-lg font-bold text-brand-400">${{ total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <AppAlert v-if="!selection.payoutsReady" type="info" :message="t('cart.errorPayouts')" />
        <AppAlert v-if="error" type="error" :message="error" />

        <button
          class="btn-primary-solid"
          :disabled="loading || !selection.payoutsReady"
          @click="checkout"
        >
          <span v-if="loading" class="loading-spinner" aria-hidden="true" />
          {{ loading ? t('cart.checkingOut') : t('cart.payAmount', { total: total.toFixed(2) }) }}
        </button>

        <p class="text-center text-xs leading-relaxed text-gray-500">
          {{ t('cart.agreePrefix') }}
          <NuxtLink to="/terms" class="text-brand-400">{{ t('cart.terms') }}</NuxtLink>
          {{ t('cart.and') }}
          <NuxtLink to="/privacy" class="text-brand-400">{{ t('cart.privacy') }}</NuxtLink>
        </p>
      </template>
    </div>
  </div>
</template>
