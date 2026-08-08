<script setup lang="ts">
definePageMeta({})

const router = useRouter()

onMounted(async () => {
  await router.replace('/confirm-email')
})
</script>

<template>
  <div />
</template>
