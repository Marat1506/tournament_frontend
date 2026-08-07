<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const route = useRoute()
const api = useApi()

const orderId = route.query.order_id as string
const guestEmail = route.query.guest_email as string | undefined

const { data: order } = await useAsyncData(`order-${orderId}`, () =>
  orderId ? api.getOrder(orderId, guestEmail) : Promise.resolve(null),
)

const downloadPhotos = computed(() => order.value?.download_photos ?? [])

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

      <div v-if="downloadPhotos.length" class="mt-8 space-y-3 text-left">
        <h2 class="font-semibold">{{ t('checkout.downloadPhotos') }}</h2>
        <a
          v-for="item in downloadPhotos"
          :key="item.photo_id"
          :href="api.downloadUrl(item.photo_id, orderId, guestEmail)"
          class="card flex items-center justify-between p-4"
          target="_blank"
        >
          <span class="truncate pr-3">{{ photoLabel(item) }}</span>
          <span class="shrink-0 font-medium text-brand-600">{{ t('checkout.download') }}</span>
        </a>
      </div>

      <NuxtLink to="/" class="btn-primary-solid mt-8 inline-block w-full">{{ t('checkout.home') }}</NuxtLink>
    </div>
  </div>
</template>
