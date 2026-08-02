<script setup lang="ts">
definePageMeta({ nav: 'light' })

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
    <AppPageHeader title="Оплата прошла!" />

    <div class="page-container text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
        <AppIcon name="check" class="h-8 w-8" />
      </div>

      <h1 class="text-xl font-bold">Спасибо за покупку</h1>
      <p v-if="order" class="mt-2 text-gray-500">
        Заказ #{{ order.id.slice(0, 8) }} · ${{ order.total }}
      </p>

      <div v-if="paidPhotos.length" class="mt-8 space-y-3 text-left">
        <h2 class="font-semibold">Скачать фото</h2>
        <a
          v-for="item in paidPhotos"
          :key="item.id"
          :href="api.downloadUrl(item.photo_id!, orderId, guestEmail)"
          class="card flex items-center justify-between p-4"
          target="_blank"
        >
          <span>Фото {{ item.photo_id?.slice(0, 8) }}</span>
          <span class="text-brand-600 font-medium">Скачать</span>
        </a>
      </div>

      <NuxtLink to="/" class="btn-primary-solid mt-8 inline-block w-full">На главную</NuxtLink>
    </div>
  </div>
</template>
