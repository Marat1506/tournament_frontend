<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const auth = useAuthStore()
const { unreadCount, canLoad } = useNotificationBadge()

const profileTo = computed(() => (
  auth.isPhotographer ? '/photographer/dashboard' : '/profile'
))

const isClient = computed(() => auth.isLoggedIn && auth.user?.role === 'client')

const items = computed(() => [
  { to: '/', label: t('nav.home'), icon: 'home' as const, match: (p: string) => p === '/' },
  {
    to: '/tournaments',
    label: isClient.value ? t('nav.findPhotos') : t('nav.tournaments'),
    icon: 'trophy' as const,
    match: (p: string) => p.startsWith('/tournaments') || p.startsWith('/t/') || p.startsWith('/cart') || p.startsWith('/checkout'),
  },
  { to: '/favorites', label: t('nav.favorites'), icon: 'heart' as const, match: (p: string) => p.startsWith('/favorites') },
  {
    to: profileTo.value,
    label: isClient.value ? t('profile.title') : t('nav.profile'),
    icon: 'user' as const,
    match: (p: string) => p.startsWith('/profile') || p.startsWith('/photographer'),
  },
])
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
    <div class="mx-auto grid max-w-lg grid-cols-4">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex min-h-[62px] flex-col items-center justify-center gap-1 text-[11px]"
        :class="item.match(route.path)
          ? 'font-semibold text-brand-400'
          : 'text-gray-400'"
      >
        <span class="relative">
          <AppIcon :name="item.icon" class="h-5 w-5" />
          <ClientOnly>
            <span
              v-if="item.icon === 'user' && canLoad && unreadCount > 0"
              class="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-600 px-0.5 text-[9px] font-bold text-white"
            >
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </ClientOnly>
        </span>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
