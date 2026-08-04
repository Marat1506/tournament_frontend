<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const api = useApi()
const { data: tournaments } = await useAsyncData('home-tournaments', () => api.getTournaments())
const { data: platform } = await useAsyncData('platform-home', () => api.getPlatformHome())

const customHero = computed(() => platform.value?.hero_image_url || '')
const heroMobile = '/main_background_mobile.png'
const heroDesktop = '/main_background.png'
</script>

<template>
  <div class="pb-24">
    <section class="relative mx-auto max-w-lg overflow-hidden">
      <div class="absolute inset-0">
        <div v-if="customHero" class="h-full w-full">
          <AppImage :src="customHero" aspect="cover" alt="" />
        </div>
        <picture v-else class="block h-full w-full">
          <source media="(min-width: 768px)" :srcset="heroDesktop">
          <img
            :src="heroMobile"
            alt=""
            class="h-full w-full object-cover object-[72%_28%] md:object-[center_30%]"
          >
        </picture>
        <div class="absolute inset-0 bg-gradient-to-r from-[#0b0f17]/90 via-[#0b0f17]/45 to-transparent" />
        <div class="absolute inset-0 bg-gradient-to-b from-[#0b0f17]/25 via-transparent to-[#0b0f17]" />
      </div>

      <div class="relative z-10 min-h-[400px] px-4 pb-6 pt-4">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
              <AppIcon name="camera" class="h-5 w-5" />
            </div>
            <span class="text-base font-bold tracking-[0.12em]">BJJ PHOTOS</span>
          </div>
          <NuxtLink to="/profile" class="flex h-10 w-10 items-center justify-center text-gray-300" :aria-label="t('nav.profile')">
            <AppIcon name="bell" class="h-5 w-5" />
          </NuxtLink>
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

      <div class="grid grid-cols-4 gap-3 pt-3">
        <NuxtLink to="/tournaments" class="flex flex-col items-center gap-2 text-center">
          <div class="quick-icon"><AppIcon name="trophy" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">{{ t('home.quickTournament') }}</span>
        </NuxtLink>
        <NuxtLink to="/tournaments" class="flex flex-col items-center gap-2 text-center">
          <div class="quick-icon"><AppIcon name="user" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">{{ t('home.quickName') }}</span>
        </NuxtLink>
        <NuxtLink to="/tournaments" class="flex flex-col items-center gap-2 text-center">
          <div class="quick-icon"><AppIcon name="face" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">{{ t('home.quickFace') }}</span>
        </NuxtLink>
        <NuxtLink to="/shop/tshirts" class="flex flex-col items-center gap-2 text-center">
          <div class="quick-icon"><AppIcon name="shirt" class="h-5 w-5" /></div>
          <span class="text-[10px] leading-tight text-gray-300">{{ t('home.quickShirts') }}</span>
        </NuxtLink>
      </div>

      <NuxtLink to="/order-photographer" class="mt-3 block text-center text-sm font-medium text-brand-400">
        {{ t('home.hirePhotographer') }}
      </NuxtLink>

      <section v-if="tournaments?.data?.length" class="space-y-3 pt-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold">{{ t('home.recentTournaments') }}</h2>
          <NuxtLink to="/tournaments" class="text-sm font-medium text-brand-400">{{ t('home.viewAll') }}</NuxtLink>
        </div>
        <div class="-mx-1 flex items-stretch gap-3 overflow-x-auto pb-2">
          <div
            v-for="tournament in tournaments.data.slice(0, 3)"
            :key="tournament.id"
            class="flex w-[132px] shrink-0"
          >
            <TournamentCard :tournament="tournament" layout="tile" class="w-full" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
