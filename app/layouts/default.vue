<script setup lang="ts">
onMounted(() => {
  document.body.classList.add('theme-dark')
  document.body.classList.remove('theme-light')
})

onUnmounted(() => {
  document.body.classList.remove('theme-dark', 'theme-light')
})
</script>

<template>
  <div class="min-h-screen bg-[#0b0f17] text-white">
    <slot />
    <AppBottomNav />
  </div>
</template>
