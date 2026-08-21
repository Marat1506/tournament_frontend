<script setup lang="ts">
definePageMeta({ ssr: false })

const { t, locale } = useI18n()
const auth = useAuthStore()
const api = useApi()
const { unreadCount, canLoad: canLoadNotifications } = useNotificationBadge()

const beltLabel = useBeltLabel(() => auth.user?.belt)

const canLoadStats = computed(() =>
  auth.isLoggedIn && auth.user?.role === 'client' && !!auth.user?.email_verified,
)

const { data: stats } = await useAsyncData(
  'profile-stats',
  () => (canLoadStats.value ? api.getProfileStats() : Promise.resolve(null)),
  { watch: [canLoadStats], server: false },
)

const primaryItems = computed(() => [
  {
    to: '/profile/photos',
    label: t('profile.myPhotos'),
    hint: t('profile.myPhotosHint'),
    icon: 'photos' as const,
  },
  {
    to: '/favorites',
    label: t('nav.favorites'),
    hint: t('profile.favoritesHint'),
    icon: 'heart' as const,
  },
  {
    to: '/profile/settings',
    label: t('profile.settings'),
    hint: t('profile.settingsHint'),
    icon: 'settings' as const,
  },
])

const secondaryItems = computed(() => [
  { to: '/profile/tournaments', label: t('profile.myTournaments'), icon: 'trophy' as const },
  { to: '/profile/orders', label: t('profile.myOrders'), icon: 'cart' as const },
  { to: '/profile/selfies', label: t('profile.mySelfies'), icon: 'face' as const },
])

function formatStat(n?: number) {
  if (n == null) return '0'
  return n.toLocaleString(locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US')
}

onMounted(async () => {
  if (auth.isLoggedIn && auth.user?.role === 'client' && !auth.user?.email_verified) {
    await navigateTo('/confirm-email')
  }
})
</script>

<template>
  <div>
    <AppPageHeader :title="t('profile.title')">
      <template #right>
        <NuxtLink
          v-if="auth.isLoggedIn && auth.user?.role === 'client'"
          to="/profile/notifications"
          class="relative flex h-10 w-10 items-center justify-center text-gray-400"
          :aria-label="t('notifications.title')"
        >
          <AppIcon name="bell" class="h-5 w-5" />
          <span
            v-if="canLoadNotifications && unreadCount > 0"
            class="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white"
          >
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4">
      <template v-if="!auth.isLoggedIn">
        <div class="card space-y-4 p-6 text-center">
          <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
            <AppIcon name="user" class="h-9 w-9" />
          </div>
          <div>
            <h2 class="font-semibold">{{ t('profile.cabinet') }}</h2>
            <p class="mt-1 text-sm text-gray-500">{{ t('profile.cabinetHint') }}</p>
          </div>
          <NuxtLink to="/login?redirect=/profile" class="btn-primary-solid">{{ t('profile.login') }}</NuxtLink>
          <NuxtLink to="/register?redirect=/profile" class="block text-sm font-medium text-brand-400">
            {{ t('profile.register') }}
          </NuxtLink>
        </div>
        <div class="card p-4 text-sm text-gray-400">{{ t('profile.guestHint') }}</div>
      </template>

      <template v-else-if="auth.isAdmin || auth.isPhotographer">
        <div class="card space-y-3 p-6 text-center">
          <h2 class="font-semibold">{{ auth.user?.name || auth.user?.email }}</h2>
          <p class="text-sm text-gray-500">{{ auth.isAdmin ? t('profile.admin') : t('profile.photographer') }}</p>
          <p class="text-sm text-gray-400">{{ auth.isAdmin ? t('profile.wrongWorldHintAdmin') : t('profile.wrongWorldHint') }}</p>
          <NuxtLink v-if="auth.isAdmin" to="/admin" class="btn-primary-solid">{{ t('profile.adminPanel') }}</NuxtLink>
          <NuxtLink v-if="auth.isPhotographer" to="/photographer/dashboard" class="btn-primary-solid">
            {{ t('profile.photographerDashboard') }}
          </NuxtLink>
          <button class="text-sm text-gray-500" @click="auth.logout()">{{ t('profile.logout') }}</button>
        </div>
      </template>

      <template v-else>
        <EmailVerificationBanner />

        <NuxtLink to="/profile/settings" class="card flex items-center gap-4 p-4 transition active:scale-[0.99]">
          <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600/20 text-brand-400">
            <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" alt="" class="h-full w-full object-cover">
            <AppIcon v-else name="user" class="h-8 w-8" />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-lg font-bold">{{ auth.user?.name || t('profile.athlete') }}</h2>
            <p class="truncate text-sm text-gray-500">{{ auth.user?.email }}</p>
            <div
              v-if="auth.user?.belt"
              class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-600/20 px-2.5 py-0.5 text-xs font-medium text-brand-400"
            >
              <AppIcon name="trophy" class="h-3.5 w-3.5" />
              {{ beltLabel }}
            </div>
          </div>
          <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
        </NuxtLink>

        <div v-if="stats" class="grid grid-cols-3 gap-2">
          <div class="card p-3 text-center">
            <div class="text-xl font-bold text-brand-400">{{ formatStat(stats.found_photos) }}</div>
            <div class="text-[11px] text-gray-500">{{ t('profile.found') }}</div>
          </div>
          <div class="card p-3 text-center">
            <div class="text-xl font-bold">{{ formatStat(stats.purchased_photos) }}</div>
            <div class="text-[11px] text-gray-500">{{ t('profile.purchased') }}</div>
          </div>
          <div class="card p-3 text-center">
            <div class="text-xl font-bold">{{ formatStat(stats.tournaments_count) }}</div>
            <div class="text-[11px] text-gray-500">{{ t('profile.tournamentsCount') }}</div>
          </div>
        </div>

        <div class="space-y-3">
          <NuxtLink
            v-for="item in primaryItems"
            :key="item.to"
            :to="item.to"
            class="cabinet-row"
          >
            <div class="icon-tile">
              <AppIcon :name="item.icon" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ item.label }}</div>
              <div class="text-sm text-gray-500">{{ item.hint }}</div>
            </div>
            <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
          </NuxtLink>
        </div>

        <div>
          <p class="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-gray-500">
            {{ t('profile.moreSection') }}
          </p>
          <nav class="card divide-y divide-white/10 overflow-hidden">
            <NuxtLink
              v-for="item in secondaryItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 px-4 py-3.5 transition active:bg-white/5"
            >
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gray-400">
                <AppIcon :name="item.icon" class="h-5 w-5" />
              </div>
              <span class="flex-1 font-medium">{{ item.label }}</span>
              <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
            </NuxtLink>
          </nav>
        </div>

        <button
          class="min-h-11 w-full rounded-2xl border border-red-500/30 py-3 text-center text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          @click="auth.logout()"
        >
          {{ t('profile.logout') }}
        </button>
      </template>

      <AppSiteFooter />
    </div>
  </div>
</template>
