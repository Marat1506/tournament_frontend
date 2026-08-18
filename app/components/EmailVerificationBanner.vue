<script setup lang="ts">
const auth = useAuthStore()
const { t } = useI18n()

const show = computed(() =>
  auth.isLoggedIn
  && auth.user?.role === 'client'
  && !auth.user?.email_verified,
)
</script>

<template>
  <ClientOnly>
    <NuxtLink
      v-if="show"
      to="/confirm-email"
      class="card flex items-center gap-3 border border-amber-500/30 bg-amber-500/10 p-4 transition active:scale-[0.99]"
    >
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
      <AppIcon name="mail" class="h-5 w-5" />
    </div>
    <div class="min-w-0 flex-1 text-left">
      <p class="text-sm font-medium text-amber-300">{{ t('confirmEmail.bannerTitle') }}</p>
      <p class="text-xs text-amber-200/70">{{ t('confirmEmail.bannerHint') }}</p>
    </div>
    <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-amber-400" />
    </NuxtLink>
  </ClientOnly>
</template>
