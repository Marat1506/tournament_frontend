<script setup lang="ts">
const auth = useAuthStore()
const api = useApi()

const { data: orders } = await useAsyncData('my-orders', () =>
  auth.isLoggedIn ? api.getMyOrders() : Promise.resolve(null),
)
</script>

<template>
  <div>
    <AppPageHeader title="Профиль" />
    <div class="page-container">
      <div class="card space-y-4 p-6 text-center">
        <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <AppIcon name="user" class="h-9 w-9" />
        </div>
        <div>
          <h2 class="font-semibold">{{ auth.user?.name || auth.user?.email || 'Гость' }}</h2>
          <p class="text-sm text-gray-500">{{ auth.user?.role || 'Войдите для покупок и истории' }}</p>
        </div>
        <NuxtLink v-if="!auth.isLoggedIn" to="/photographer/login" class="text-sm font-medium text-brand-600">
          Войти
        </NuxtLink>
        <button v-else class="text-sm text-gray-500" @click="auth.logout()">Выйти</button>
      </div>

      <div v-if="auth.isPhotographer" class="card mt-4 p-4">
        <NuxtLink to="/photographer/dashboard" class="font-medium text-brand-600">Кабинет фотографа →</NuxtLink>
      </div>

      <div v-if="orders?.data?.length" class="card mt-4 divide-y divide-gray-100">
        <div v-for="order in orders.data" :key="order.id" class="flex items-center justify-between p-4">
          <div>
            <div class="font-medium">Заказ #{{ order.id.slice(0, 8) }}</div>
            <div class="text-sm text-gray-500">${{ order.total }} · {{ order.status }}</div>
          </div>
          <NuxtLink v-if="order.status === 'paid'" :to="`/checkout/success?order_id=${order.id}`" class="text-brand-600">
            Скачать
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
