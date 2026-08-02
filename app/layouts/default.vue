<script setup lang="ts">
const route = useRoute()

const navVariant = computed<'light' | 'dark'>(() => {
  return route.meta.nav === 'dark' ? 'dark' : 'light'
})

const pageBg = computed(() =>
  navVariant.value === 'dark' ? 'bg-[#0b0f17] text-white' : 'bg-[#f5f7fb] text-gray-900',
)

watch(pageBg, (cls) => {
  if (!import.meta.client) return
  const dark = cls.includes('0b0f17')
  document.body.classList.toggle('theme-dark', dark)
  document.body.classList.toggle('theme-light', !dark)
}, { immediate: true })

onUnmounted(() => {
  if (!import.meta.client) return
  document.body.classList.remove('theme-dark', 'theme-light')
})
</script>

<template>
  <div class="min-h-screen" :class="pageBg">
    <slot />
    <AppBottomNav :variant="navVariant" />
  </div>
</template>
