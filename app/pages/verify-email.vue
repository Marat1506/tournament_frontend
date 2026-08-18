<script setup lang="ts">
definePageMeta({ ssr: false })

const router = useRouter()

onMounted(async () => {
  await router.replace('/confirm-email')
})
</script>

<template>
  <div />
</template>
