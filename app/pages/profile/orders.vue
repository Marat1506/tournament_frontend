<script setup lang="ts">
definePageMeta({ middleware: 'client-auth', ssr: false })

const { t, locale } = useI18n()
const api = useApi()
const router = useRouter()

const { data, pending } = await useAsyncData('profile-orders', () => api.getMyOrders(), { server: false })

const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('profileOrders.statusPending'),
  paid: t('profileOrders.statusPaid'),
  failed: t('profileOrders.statusFailed'),
  cancelled: t('profileOrders.statusCancelled'),
}))

function formatDate(iso: string) {
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(iso).toLocaleString(loc)
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('profileOrders.title')">
      <template #left>
        <button class="flex h-10 w-10 items-center justify-center" :aria-label="t('common.back')" @click="router.back()">
          <AppIcon name="back" class="h-5 w-5" />
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-3 !pt-0">
      <div v-if="pending" class="space-y-3">
        <div v-for="n in 3" :key="n" class="card h-20 animate-pulse bg-white/10" />
      </div>

      <div v-for="order in data?.data" :key="order.id" class="card p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-semibold">{{ t('profileOrders.order', { id: order.id.slice(0, 8) }) }}</div>
            <div class="text-sm text-gray-500">{{ formatDate(order.created_at) }}</div>
          </div>
          <div class="text-right">
            <div class="font-bold">${{ order.total }}</div>
            <div class="text-xs" :class="order.status === 'paid' ? 'text-green-600' : 'text-gray-500'">
              {{ statusLabels[order.status] || order.status }}
            </div>
          </div>
        </div>
        <NuxtLink
          v-if="order.status === 'paid'"
          :to="`/checkout/success?order_id=${order.id}`"
          class="mt-3 inline-flex text-sm font-medium text-brand-600"
        >
          {{ t('profileOrders.download') }}
        </NuxtLink>
      </div>

      <p v-if="!pending && !data?.data?.length" class="py-8 text-center text-sm text-gray-500">
        {{ t('profileOrders.empty') }}
      </p>
    </div>
  </div>
</template>
