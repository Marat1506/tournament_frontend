<script setup lang="ts">
import type { UserNotification } from '~/types'

definePageMeta({ middleware: 'client-auth', ssr: false })

const { t, locale } = useI18n()
const api = useApi()
const router = useRouter()
const { refresh: refreshBadge } = useNotificationBadge()

const { data, pending, refresh } = await useAsyncData('profile-notifications', () => api.getNotifications(), { server: false })

function formatDate(iso: string) {
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(iso).toLocaleString(loc)
}

async function markRead(item: UserNotification) {
  if (item.read_at) return
  try {
    await api.markNotificationRead(item.id)
    item.read_at = new Date().toISOString()
    await refreshBadge()
  }
  catch {
    // ignore
  }
}

async function openNotification(item: UserNotification) {
  await markRead(item)
  if (item.link) {
    await navigateTo(item.link)
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('notifications.title')">
      <template #left>
        <button class="flex h-10 w-10 items-center justify-center" :aria-label="t('common.back')" @click="router.back()">
          <AppIcon name="back" class="h-5 w-5" />
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-3 !pt-0">
      <div v-if="pending" class="space-y-3">
        <div v-for="n in 4" :key="n" class="card h-20 animate-pulse bg-white/10" />
      </div>

      <button
        v-for="item in data?.data"
        :key="item.id"
        type="button"
        class="card w-full p-4 text-left transition active:scale-[0.99]"
        :class="item.read_at ? 'opacity-75' : 'ring-1 ring-brand-500/20'"
        @click="openNotification(item)"
      >
        <div class="flex items-start gap-3">
          <span
            class="mt-1 h-2 w-2 shrink-0 rounded-full"
            :class="item.read_at ? 'bg-transparent' : 'bg-brand-500'"
          />
          <div class="min-w-0 flex-1">
            <div class="font-semibold">{{ item.title }}</div>
            <p v-if="item.body" class="mt-1 text-sm text-gray-400">{{ item.body }}</p>
            <div class="mt-2 text-xs text-gray-500">{{ formatDate(item.created_at) }}</div>
          </div>
          <AppIcon v-if="item.link" name="chevron" class="h-5 w-5 shrink-0 text-gray-500" />
        </div>
      </button>

      <p v-if="!pending && !data?.data?.length" class="py-8 text-center text-sm text-gray-500">
        {{ t('notifications.empty') }}
      </p>
    </div>
  </div>
</template>
