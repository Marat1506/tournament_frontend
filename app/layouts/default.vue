<script setup lang="ts">
useHead({
  htmlAttrs: { class: 'theme-dark' },
})
</script>

<template>
  <div class="min-h-screen bg-[#0b0f17] text-white">
    <AppToast />
    <slot />
    <AppBottomNav />
  </div>
</template>
