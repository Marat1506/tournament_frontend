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

const paidPhotos = computed(() =>
  order.value?.items?.filter(i => i.item_type === 'single' && i.photo_id) ?? [],
)
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

      <div v-if="paidPhotos.length" class="mt-8 space-y-3 text-left">
        <h2 class="font-semibold">{{ t('checkout.downloadPhotos') }}</h2>
        <a
          v-for="item in paidPhotos"
          :key="item.id"
          :href="api.downloadUrl(item.photo_id!, orderId, guestEmail)"
          class="card flex items-center justify-between p-4"
          target="_blank"
        >
          <span>{{ t('checkout.photo', { id: item.photo_id?.slice(0, 8) }) }}</span>
          <span class="text-brand-600 font-medium">{{ t('checkout.download') }}</span>
        </a>
      </div>

      <NuxtLink to="/" class="btn-primary-solid mt-8 inline-block w-full">{{ t('checkout.home') }}</NuxtLink>
    </div>
  </div>
</template>
