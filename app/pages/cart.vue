<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()

const tournamentId = computed(() =>
  (route.query.tournament_id as string | undefined) || selection.tournamentId,
)
const guestEmail = ref('')
const loading = ref(false)
const error = ref('')

const hasItems = computed(() => selection.items.length > 0 || !!selection.bundle)
const total = computed(() => selection.total)
const count = computed(() => selection.count)

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
    } else {
      window.location.href = result.url
    }
  } catch (e: unknown) {
    const key = mapApiError(e, [
      { match: 'cart is empty', key: 'cart.errorEmpty' },
      { match: 'guest_email', key: 'cart.errorEmail' },
      { match: 'photo not found', key: 'cart.errorPhotoUnavailable' },
      { match: 'not available', key: 'cart.errorPhotoUnavailable' },
      { match: 'bundle requires', key: 'cart.errorBundleMin' },
      { match: 'payment method', key: 'cart.errorPayment' },
    ], 'cart.errorCheckout')
    error.value = t(key)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pb-24">
    <AppPageHeader :title="t('cart.title')" />

    <div class="page-container">
      <div v-if="!hasItems" class="card p-10 text-center text-gray-500">
        {{ t('cart.empty') }}
      </div>

      <div v-else class="space-y-3">
        <div v-if="selection.bundle" class="card p-4">
          <div class="font-medium">{{ t('cart.bundle', { name: selection.bundle.athleteName }) }}</div>
          <div class="text-sm text-gray-500">{{ t('cart.bundleHint') }} · ${{ selection.bundle.price }}</div>
          <button class="mt-2 text-sm text-red-500" @click="selection.clear()">{{ t('cart.remove') }}</button>
        </div>

        <div v-for="photo in selection.items" :key="photo.id" class="card flex items-center justify-between p-4">
          <div>
            <div class="font-medium">{{ photo.original_filename || photo.id.slice(0, 8) }}</div>
            <div class="text-sm text-gray-500">${{ photo.price }}</div>
          </div>
          <button class="text-sm text-red-500" @click="selection.toggle(photo)">{{ t('cart.remove') }}</button>
        </div>

        <div v-if="!auth.isLoggedIn" class="card p-4">
          <label class="mb-2 block text-sm font-medium">{{ t('cart.guestEmail') }}</label>
          <input v-model="guestEmail" type="email" class="input-field" placeholder="you@example.com" required>
        </div>

        <div class="flex items-center justify-between px-1 text-lg font-bold">
          <span>{{ t('cart.total') }}</span>
          <span>${{ total.toFixed(2) }}</span>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button class="btn-primary-solid w-full" :disabled="loading || (!auth.isLoggedIn && !guestEmail)" @click="checkout">
          {{ loading ? t('cart.checkingOut') : t('cart.checkout', { count }) }}
        </button>
      </div>
    </div>
  </div>
</template>
