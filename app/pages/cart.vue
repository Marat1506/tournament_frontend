<script setup lang="ts">
definePageMeta({ nav: 'light' })

const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()

const slug = route.query.tournament as string | undefined
const tournamentId = computed(() =>
  (route.query.tournament_id as string | undefined) || selection.tournamentId,
)
const guestEmail = ref('')
const loading = ref(false)
const error = ref('')

const total = computed(() => selection.total)
const count = computed(() => selection.count)

async function checkout() {
  if (!selection.items.length || !tournamentId.value) {
    error.value = 'Корзина пуста'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const order = await api.createOrder({
      tournament_id: tournamentId.value,
      guest_email: auth.isLoggedIn ? undefined : guestEmail.value,
      items: selection.items.map(p => ({
        type: 'single',
        photo_id: p.id,
      })),
    })
    const result = await api.checkout(order.id, auth.isLoggedIn ? undefined : guestEmail.value)
    selection.clear()
    if (result.dev_mode) {
      await navigateTo(result.url)
    } else {
      window.location.href = result.url
    }
  } catch {
    error.value = 'Не удалось оформить заказ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pb-24">
    <AppPageHeader title="Корзина" />

    <div class="page-container">
      <div v-if="!selection.items.length" class="card p-10 text-center text-gray-500">
        Корзина пуста
      </div>

      <div v-else class="space-y-3">
        <div v-for="photo in selection.items" :key="photo.id" class="card flex items-center justify-between p-4">
          <div>
            <div class="font-medium">{{ photo.original_filename || photo.id.slice(0, 8) }}</div>
            <div class="text-sm text-gray-500">${{ photo.price }}</div>
          </div>
          <button class="text-sm text-red-500" @click="selection.toggle(photo)">Удалить</button>
        </div>

        <div v-if="!auth.isLoggedIn" class="card p-4">
          <label class="mb-2 block text-sm font-medium">Email для ссылки на скачивание</label>
          <input v-model="guestEmail" type="email" class="input-field" placeholder="you@example.com" required>
        </div>

        <div class="flex items-center justify-between px-1 text-lg font-bold">
          <span>Итого</span>
          <span>${{ total.toFixed(2) }}</span>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <button class="btn-primary-solid w-full" :disabled="loading || (!auth.isLoggedIn && !guestEmail)" @click="checkout">
          {{ loading ? 'Оформление...' : `Оплатить (${count})` }}
        </button>

        <p v-if="!tournamentId" class="text-xs text-amber-600">
          Откройте корзину из галереи турнира, чтобы оформить заказ.
        </p>
      </div>
    </div>
  </div>
</template>
