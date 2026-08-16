<script setup lang="ts">
definePageMeta({})

const { t, locale } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const { unreadCount, canLoad: canLoadNotifications } = useNotificationBadge()

const beltLabel = useBeltLabel(() => auth.user?.belt)

const canLoadStats = computed(() =>
  auth.isLoggedIn && auth.user?.role === 'client' && !!auth.user?.email_verified,
)

const { data: stats } = await useAsyncData(
  'profile-stats',
  () => (canLoadStats.value ? api.getProfileStats() : Promise.resolve(null)),
  { watch: [canLoadStats] },
)

const menuItems = computed(() => [
  { to: '/profile/photos', label: t('profile.myPhotos'), icon: 'photos' as const, primary: true },
  { to: '/profile/tournaments', label: t('profile.myTournaments'), icon: 'trophy' as const },
  { to: '/profile/orders', label: t('profile.myOrders'), icon: 'cart' as const },
  { to: '/profile/notifications', label: t('notifications.title'), icon: 'bell' as const },
  { to: '/favorites', label: t('nav.favorites'), icon: 'heart' as const },
  { to: '/profile/selfies', label: t('profile.mySelfies'), icon: 'face' as const },
  { to: '/profile/settings', label: t('profile.settings'), icon: 'settings' as const },
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
          class="relative flex h-10 w-10 items-center justify-center text-gray-500"
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
          <p class="text-sm text-gray-400">{{ t('profile.wrongWorldHint') }}</p>
          <NuxtLink v-if="auth.isAdmin" to="/admin" class="btn-primary-solid">{{ t('profile.adminPanel') }}</NuxtLink>
          <NuxtLink v-if="auth.isPhotographer" to="/photographer/dashboard" class="btn-primary-solid">
            {{ t('profile.photographerDashboard') }}
          </NuxtLink>
          <button class="text-sm text-gray-500" @click="auth.logout()">{{ t('profile.logoutToAthlete') }}</button>
        </div>
      </template>

      <template v-else>
        <EmailVerificationBanner />

        <div class="card p-5">
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600/20 text-brand-400">
              <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" alt="" class="h-full w-full object-cover">
              <AppIcon v-else name="user" class="h-8 w-8" />
            </div>
            <div class="min-w-0">
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
          </div>

          <div v-if="stats" class="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
            <div class="text-center">
              <div class="text-xl font-bold text-brand-600">{{ formatStat(stats.found_photos) }}</div>
              <div class="text-[11px] text-gray-500">{{ t('profile.found') }}</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold">{{ formatStat(stats.purchased_photos) }}</div>
              <div class="text-[11px] text-gray-500">{{ t('profile.purchased') }}</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold">{{ formatStat(stats.tournaments_count) }}</div>
              <div class="text-[11px] text-gray-500">{{ t('profile.tournamentsCount') }}</div>
            </div>
          </div>
        </div>

        <nav class="card divide-y divide-white/10 overflow-hidden">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-3.5 transition active:bg-white/5"
            :class="item.primary ? 'bg-brand-600/10' : ''"
          >
            <div
              class="flex h-9 w-9 items-center justify-center rounded-xl"
              :class="item.primary ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-400'"
            >
              <AppIcon :name="item.icon" class="h-5 w-5" />
            </div>
            <span class="flex-1 font-medium" :class="item.primary ? 'text-brand-400' : ''">{{ item.label }}</span>
            <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
          </NuxtLink>
        </nav>

        <NuxtLink to="/tournaments" class="card flex items-center gap-4 p-4 transition active:scale-[0.99]">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <AppIcon name="face" class="h-6 w-6" />
          </div>
          <div class="flex-1">
            <div class="font-semibold text-brand-400">{{ t('profile.findNewPhotos') }}</div>
            <div class="text-sm text-gray-500">{{ t('profile.findNewPhotosHint') }}</div>
          </div>
          <AppIcon name="chevron" class="h-5 w-5 text-brand-400" />
        </NuxtLink>

        <button class="w-full py-2 text-center text-sm text-gray-500" @click="auth.logout()">
          {{ t('profile.logout') }}
        </button>
      </template>

      <AppSiteFooter />
    </div>
  </div>
</template>
