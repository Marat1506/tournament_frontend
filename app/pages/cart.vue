<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()

if (import.meta.client) selection.hydrate()

const tournamentId = computed(() =>
  (route.query.tournament_id as string | undefined) || selection.tournamentId,
)
const guestEmail = ref('')
const loading = ref(false)
const error = ref('')
const step = computed(() => (hasItems.value ? 4 : 3))

const hasItems = computed(() => selection.items.length > 0 || !!selection.bundle)
const total = computed(() => selection.total)
const count = computed(() => selection.count)

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
  if (!hasItems.value || !tournamentId.value) {
    error.value = t('cart.errorEmpty')
    return
  }
  loading.value = true
  error.value = ''
  try {
    const items = selection.bundle
      ? [{ type: 'bundle', athlete_id: selection.bundle.athleteId }]
      : selection.items.map(p => ({ type: 'single', photo_id: p.id }))

    const order = await api.createOrder({
      tournament_id: tournamentId.value,
      guest_email: auth.isLoggedIn ? undefined : guestEmail.value,
      items,
    })
    const result = await api.checkout(order.id, auth.isLoggedIn ? undefined : guestEmail.value)
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
      { match: 'payouts_not_ready', key: 'cart.errorPayouts' },
    ], 'cart.errorCheckout')
    error.value = t(key)
  }
  finally {
    loading.value = false
  }
}

function removePhoto(id: string) {
  const photo = selection.items.find(p => p.id === id)
  if (photo) selection.toggle(photo)
}

const backToPhotos = computed(() => {
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
      <SearchStepper :current="step" :steps="4" tournament-to="/tournaments" />

      <div v-if="!hasItems" class="card p-10 text-center text-gray-500">
        {{ t('cart.empty') }}
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
                class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs"
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
          <label class="mb-2 block text-sm font-medium">{{ t('cart.guestEmail') }}</label>
          <input v-model="guestEmail" type="email" class="input-field" placeholder="you@example.com" required>
        </div>

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
        <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

        <button
          class="btn-primary-solid"
          :disabled="loading || !selection.payoutsReady || (!auth.isLoggedIn && !guestEmail)"
          @click="checkout"
        >
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
