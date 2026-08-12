<script setup lang="ts">
const { t } = useI18n()

const links = [
  { to: '/support', labelKey: 'legal.support' },
  { to: '/privacy', labelKey: 'legal.privacy' },
  { to: '/terms', labelKey: 'legal.terms' },
]
</script>

<template>
  <footer class="border-t border-white/10 py-6 text-center text-sm text-gray-500">
    <nav class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="hover:text-brand-400"
      >
        {{ t(link.labelKey) }}
      </NuxtLink>
    </nav>
    <p class="mt-3 text-xs text-gray-600">
      © {{ new Date().getFullYear() }} PixMomento
    </p>
  </footer>
</template>
