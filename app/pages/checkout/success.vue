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
const downloadingAll = ref(false)

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

async function downloadAll() {
  if (downloadingAll.value || !downloadPhotos.value.length) return
  downloadingAll.value = true
  downloadError.value = ''
  try {
    for (const item of downloadPhotos.value) {
      await api.downloadPhoto(
        item.photo_id,
        item.original_filename,
        orderId,
        effectiveGuestEmail.value,
      )
    }
  }
  catch {
    downloadError.value = t('checkout.downloadFailed')
  }
  finally {
    downloadingAll.value = false
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

    <div class="page-container space-y-5">
      <SearchStepper :current="4" :steps="4" tournament-to="/tournaments" />

      <div class="text-center">
        <div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400">
          <AppIcon name="check" class="h-10 w-10" />
        </div>
        <h1 class="text-xl font-bold">{{ t('cart.paymentSuccess') }}</h1>
        <p class="mt-2 text-gray-400">{{ t('cart.thanks') }}</p>
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
          <span class="font-semibold">{{ t('cart.totalPaid') }}</span>
          <span class="text-lg font-bold text-brand-400">${{ order.total }}</span>
        </div>
      </div>

      <p v-if="confirming && !downloadPhotos.length" class="text-center text-sm text-gray-400">
        {{ t('checkout.confirmingPayment') }}
      </p>
      <p v-else-if="!isPaid" class="text-center text-sm text-amber-300">
        {{ t('checkout.paymentPending') }}
      </p>

      <div class="space-y-3">
        <h2 class="font-semibold">{{ t('cart.whatsNext') }}</h2>

        <div class="cabinet-row">
          <div class="icon-tile">
            <AppIcon name="download" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t('cart.downloadTitle') }}</div>
            <div class="text-sm text-gray-500">{{ t('cart.downloadHint') }}</div>
          </div>
          <button
            class="btn-outline shrink-0"
            :disabled="!downloadPhotos.length || downloadingAll"
            @click="downloadAll"
          >
            {{ downloadingAll ? t('checkout.downloading') : t('cart.downloadBtn') }}
          </button>
        </div>

        <div class="cabinet-row">
          <div class="icon-tile">
            <AppIcon name="mail" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t('cart.emailSentTitle') }}</div>
            <div class="text-sm text-gray-500">{{ t('cart.emailSentHint') }}</div>
          </div>
          <span class="rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-300">
            {{ t('cart.emailSentBadge') }}
          </span>
        </div>

        <div class="cabinet-row">
          <div class="icon-tile">
            <AppIcon name="heart" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ t('cart.favTitle') }}</div>
            <div class="text-sm text-gray-500">{{ t('cart.favHint') }}</div>
          </div>
          <NuxtLink to="/favorites" class="btn-outline shrink-0">{{ t('cart.favBtn') }}</NuxtLink>
        </div>
      </div>

      <div v-if="downloadPhotos.length" class="space-y-2 text-left">
        <h3 class="text-sm font-semibold text-gray-400">{{ t('checkout.downloadPhotos') }}</h3>
        <button
          v-for="item in downloadPhotos"
          :key="item.photo_id"
          type="button"
          class="btn-secondary w-full justify-between px-4"
          :disabled="downloadingId === item.photo_id"
          @click="downloadItem(item)"
        >
          <span class="truncate pr-3 text-left">{{ photoLabel(item) }}</span>
          <span class="shrink-0 text-brand-400">
            {{ downloadingId === item.photo_id ? t('checkout.downloading') : t('checkout.download') }}
          </span>
        </button>
        <p v-if="downloadError" class="text-sm text-red-400">{{ downloadError }}</p>
      </div>

      <NuxtLink
        v-if="auth.isLoggedIn"
        to="/profile/orders"
        class="block text-center text-sm font-medium text-brand-400"
      >
        {{ t('checkout.myPurchases') }}
      </NuxtLink>

      <NuxtLink to="/" class="btn-primary-solid gap-2">
        <AppIcon name="home" class="h-5 w-5" />
        {{ t('cart.backHome') }}
      </NuxtLink>
    </div>
  </div>
</template>
