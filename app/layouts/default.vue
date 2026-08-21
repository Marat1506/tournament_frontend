<script setup lang="ts">
useHead({
  htmlAttrs: { class: 'theme-dark' },
})

const route = useRoute()
const showAppNav = computed(() => !route.path.startsWith('/admin'))
</script>

<template>
  <div class="min-h-screen bg-page text-white">
    <AppToast />
    <slot />
    <AppBottomNav v-if="showAppNav" />
  </div>
</template>
