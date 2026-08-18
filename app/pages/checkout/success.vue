<script setup lang="ts">
definePageMeta({ ssr: false })

const { t } = useI18n()
const route = useRoute()
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()
if (import.meta.client) auth.hydrate()

const orderId = route.query.order_id as string
const guestEmail = route.query.guest_email as string | undefined

const { data: order, refresh } = await useAsyncData(
  `order-${orderId}`,
  () => orderId ? api.getOrder(orderId, guestEmail) : Promise.resolve(null),
  { server: false },
)

watch(order, (o) => {
  if (o?.status === 'paid') {
    selection.clear()
  }
}, { immediate: true })

const downloadPhotos = computed(() => order.value?.download_photos ?? [])
const isPaid = computed(() => order.value?.status === 'paid')
const confirming = ref(false)
const effectiveGuestEmail = computed(() => guestEmail || order.value?.guest_email || undefined)

const downloadingId = ref<string | null>(null)
const downloadError = ref('')

onMounted(async () => {
  if (!orderId) return
  if (isPaid.value && downloadPhotos.value.length) return

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
    if (isPaid.value) break
  }
  confirming.value = false
})

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
  catch {
    downloadError.value = t('checkout.downloadFailed')
  }
  finally {
    downloadingId.value = null
  }
}

function photoLabel(item: { photo_id: string; original_filename?: string; item_type?: string }) {
  if (item.original_filename) return item.original_filename
  if (item.item_type === 'bundle') return t('checkout.bundlePhoto', { id: item.photo_id.slice(0, 8) })
  return t('checkout.photo', { id: item.photo_id.slice(0, 8) })
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('checkout.successTitle')" />

    <div class="page-container text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
        <AppIcon name="check" class="h-8 w-8" />
      </div>

      <h1 class="text-xl font-bold">{{ t('checkout.thankYou') }}</h1>
      <p v-if="order" class="mt-2 text-gray-500">
        {{ t('checkout.orderSummary', { id: order.id.slice(0, 8), total: order.total }) }}
      </p>

      <p v-if="confirming && !downloadPhotos.length" class="mt-4 text-sm text-gray-400">
        {{ t('checkout.confirmingPayment') }}
      </p>
      <p v-else-if="!isPaid" class="mt-4 text-sm text-amber-300">
        {{ t('checkout.paymentPending') }}
      </p>
      <p v-else-if="downloadPhotos.length" class="mt-4 text-sm text-gray-300">
        {{ t('checkout.downloadHint') }}
      </p>

      <div v-if="downloadPhotos.length" class="mt-6 space-y-3 text-left">
        <h2 class="font-semibold">{{ t('checkout.downloadPhotos') }}</h2>
        <button
          v-for="item in downloadPhotos"
          :key="item.photo_id"
          type="button"
          class="btn-primary-solid flex w-full items-center justify-between px-4"
          :disabled="downloadingId === item.photo_id"
          @click="downloadItem(item)"
        >
          <span class="truncate pr-3 text-left">{{ photoLabel(item) }}</span>
          <span class="shrink-0">
            {{ downloadingId === item.photo_id ? t('checkout.downloading') : t('checkout.download') }}
          </span>
        </button>
        <p v-if="downloadError" class="text-sm text-red-500">{{ downloadError }}</p>
      </div>

      <NuxtLink
        v-if="auth.isLoggedIn"
        to="/profile/orders"
        class="mt-6 inline-block text-sm font-medium text-brand-500"
      >
        {{ t('checkout.myPurchases') }}
      </NuxtLink>

      <NuxtLink to="/" class="btn-secondary mt-6 w-full">{{ t('checkout.home') }}</NuxtLink>
    </div>
  </div>
</template>
