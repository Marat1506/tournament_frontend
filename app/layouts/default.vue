<script setup lang="ts">
useHead({
  htmlAttrs: { class: 'theme-dark' },
})

const route = useRoute()
const showAthleteNav = computed(() => {
  const path = route.path
  return !path.startsWith('/photographer') && !path.startsWith('/admin')
})
</script>

<template>
  <div class="min-h-screen bg-[#0b0f17] text-white">
    <AppToast />
    <slot />
    <AppBottomNav v-if="showAthleteNav" />
  </div>
</template>
