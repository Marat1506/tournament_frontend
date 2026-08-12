<script setup lang="ts">
const props = defineProps<{
  type: 'success' | 'error' | 'info'
  message: string
}>()

const styles = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-500/10 text-green-300 ring-green-500/25'
    case 'error':
      return 'bg-red-500/10 text-red-300 ring-red-500/25'
    default:
      return 'bg-brand-600/10 text-brand-200 ring-brand-500/25'
  }
})
</script>

<template>
  <p v-if="message" class="rounded-xl px-4 py-3 text-sm font-medium ring-1" :class="styles" role="alert">
    {{ message }}
  </p>
</template>
