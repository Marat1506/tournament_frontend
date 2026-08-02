<script setup lang="ts">
const route = useRoute()

defineProps<{
  variant?: 'light' | 'dark'
}>()

const items = [
  { to: '/', label: 'Главная', icon: 'home' as const, match: (p: string) => p === '/' },
  { to: '/tournaments', label: 'Турниры', icon: 'trophy' as const, match: (p: string) => p.startsWith('/tournaments') || p.startsWith('/t/') },
  { to: '/favorites', label: 'Избранное', icon: 'heart' as const, match: (p: string) => p.startsWith('/favorites') },
  { to: '/profile', label: 'Профиль', icon: 'user' as const, match: (p: string) => p.startsWith('/profile') },
]
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)]"
    :class="variant === 'dark'
      ? 'border-white/10 bg-[#0b0f17]/95 backdrop-blur-md'
      : 'border-gray-100 bg-white shadow-nav'"
  >
    <div class="mx-auto grid max-w-lg grid-cols-4">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex min-h-[62px] flex-col items-center justify-center gap-1 text-[11px]"
        :class="item.match(route.path)
          ? (variant === 'dark' ? 'text-brand-400 font-semibold' : 'text-brand-600 font-semibold')
          : (variant === 'dark' ? 'text-gray-400' : 'text-gray-500')"
      >
        <AppIcon :name="item.icon" class="h-5 w-5" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>
