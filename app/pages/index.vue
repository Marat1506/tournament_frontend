<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const api = useApi()
const { data: tournaments } = await useAsyncData('home-tournaments', () => api.getTournaments())
const { data: platform } = await useAsyncData('platform-home', () => api.getPlatformHome())

const customHero = computed(() => platform.value?.hero_image_url || '')
</script>

<template>
  <div class="pb-24">
    <section class="relative mx-auto max-w-lg overflow-hidden">
      <div class="absolute inset-0">
        <div v-if="customHero" class="h-full w-full">
          <AppImage :src="customHero" aspect="cover" alt="" />
        </div>
        <div v-else class="hero-bg-default" />
        <div class="absolute inset-0 bg-gradient-to-r from-[#0b0f17]/90 via-[#0b0f17]/45 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/25 via-transparent to-[#0b0f17]" />
      </div>

      <div class="relative z-10 min-h-[400px] px-4 pb-6 pt-4">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
              <AppIcon name="camera" class="h-5 w-5" />
            </div>
            <span class="text-base font-bold tracking-[0.08em]">PixMomento</span>
          </div>
          <div class="flex items-center gap-2">
            <AppLocaleSwitcher />
            <NuxtLink to="/profile/notifications" class="flex h-10 w-10 items-center justify-center text-gray-300" :aria-label="t('notifications.title')">
            <AppIcon name="bell" class="h-5 w-5" />
          </NuxtLink>
          </div>
        </header>

        <div class="mt-10 max-w-[290px]">
          <h1 class="text-[28px] font-bold leading-[1.12] tracking-tight">
            {{ t('home.heroTitle') }}
          </h1>
          <p class="mt-2.5 text-sm leading-relaxed text-gray-300">
            {{ t('home.heroSubtitle') }}
          </p>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-lg space-y-3 px-4 pt-2">
      <NuxtLink to="/tournaments" class="btn-primary">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <AppIcon name="search" class="h-5 w-5" />
        </div>
        <div>
          <div>{{ t('home.findPhotos') }}</div>
          <div class="text-xs font-normal text-white/75">{{ t('home.findPhotosHint') }}</div>
        </div>
      </NuxtLink>

      <NuxtLink to="/photographer/login" class="btn-secondary">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gray-300">
          <AppIcon name="upload" class="h-5 w-5" />
        </div>
        <div>
          <div>{{ t('home.uploadPhotos') }}</div>
          <div class="text-xs font-normal text-gray-400">{{ t('home.uploadPhotosHint') }}</div>
        </div>
      </NuxtLink>

      <div class="flex justify-center gap-6 pt-2 text-sm">
        <NuxtLink to="/shop/tshirts" class="font-medium text-brand-400">{{ t('home.quickShirts') }}</NuxtLink>
        <NuxtLink to="/order-photographer" class="font-medium text-brand-400">{{ t('home.hirePhotographerShort') }}</NuxtLink>
      </div>

      <section v-if="tournaments?.data?.length" class="space-y-3 pt-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold">{{ t('home.recentTournaments') }}</h2>
          <NuxtLink to="/tournaments" class="text-sm font-medium text-brand-400">{{ t('home.viewAll') }}</NuxtLink>
        </div>
        <p class="text-sm text-gray-500">{{ t('home.recentHint') }}</p>
        <TournamentCard
          v-for="tournament in tournaments.data.slice(0, 5)"
          :key="tournament.id"
          :tournament="tournament"
        />
      </section>
    </div>

    <AppSiteFooter class="mx-auto max-w-lg px-4 pb-8" />
  </div>
</template>
