<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const api = useApi()
const { data: tournaments } = await useAsyncData('home-tournaments', () => api.getTournaments())

const featured = computed(() => tournaments.value?.data?.slice(0, 8) ?? [])

const carouselRef = ref<HTMLElement | null>(null)
const activeSlide = ref(0)

function onCarouselScroll() {
  const el = carouselRef.value
  if (!el || !featured.value.length) return
  const card = el.querySelector('[data-tournament-card]') as HTMLElement | null
  const step = (card?.offsetWidth ?? 120) + 8
  activeSlide.value = Math.min(
    featured.value.length - 1,
    Math.max(0, Math.round(el.scrollLeft / step)),
  )
}

const howSteps = computed(() => [
  { n: 1, icon: 'calendar' as const, title: t('home.howStep1Title'), text: t('home.howStep1Text') },
  { n: 2, icon: 'face' as const, title: t('home.howStep2Title'), text: t('home.howStep2Text') },
  { n: 3, icon: 'photos' as const, title: t('home.howStep3Title'), text: t('home.howStep3Text') },
])

const trustItems = computed(() => [
  { icon: 'shield' as const, title: t('home.trustSafe'), text: t('home.trustSafeText') },
  { icon: 'lock' as const, title: t('home.trustPrivate'), text: t('home.trustPrivateText') },
  { icon: 'star' as const, title: t('home.trustQuality'), text: t('home.trustQualityText') },
])
</script>

<template>
  <div class="pb-24">
    <section class="relative mx-auto max-w-lg overflow-hidden px-6 pb-8 pt-4">
      <div
        class="pointer-events-none absolute -right-8 top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl"
        aria-hidden="true"
      />

      <header class="relative flex items-center justify-between">
        <span class="text-lg font-bold lowercase tracking-[0.04em]">pixmomento</span>
        <div class="flex items-center gap-2">
          <AppLocaleSwitcher />
          <NuxtLink
            to="/profile"
            class="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 ring-1 ring-white/15"
            :aria-label="t('nav.profile')"
          >
            <AppIcon name="user" class="h-5 w-5" />
          </NuxtLink>
        </div>
      </header>

      <div class="relative mt-10 max-w-[62%]">
        <h1 class="text-[28px] font-bold leading-[1.12] tracking-tight">
          {{ t('home.heroBefore') }}
          <span class="text-brand-400">{{ t('home.heroAccent') }}</span>
          {{ t('home.heroAfter') }}
        </h1>
        <p class="mt-3 text-[13px] leading-relaxed text-gray-400">
          {{ t('home.heroSubtitle') }}
        </p>
      </div>

      <div class="relative mt-8 w-full space-y-3">
        <NuxtLink to="/tournaments" class="btn-primary-solid">
          <AppIcon name="face" class="h-5 w-5" />
          {{ t('home.findPhotos') }}
        </NuxtLink>
        <NuxtLink to="/photographer/login" class="btn-ghost-brand">
          <AppIcon name="camera" class="h-5 w-5" />
          {{ t('home.uploadPhotos') }}
        </NuxtLink>
      </div>
    </section>

    <div class="mx-auto max-w-lg space-y-8 px-6">
      <section>
        <h2 class="mb-4 text-[15px] font-bold">{{ t('home.howTitle') }}</h2>
        <div class="flex items-stretch gap-1.5">
          <template v-for="(step, index) in howSteps" :key="step.n">
            <div class="home-step-card">
              <span class="absolute left-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {{ step.n }}
              </span>
              <AppIcon :name="step.icon" class="mb-2.5 h-7 w-7 text-brand-400" />
              <div class="text-[12px] font-semibold leading-snug text-white">{{ step.title }}</div>
              <p class="mt-1.5 text-[10px] leading-snug text-gray-500">{{ step.text }}</p>
            </div>
            <span
              v-if="index < howSteps.length - 1"
              class="flex shrink-0 items-center text-sm text-gray-600"
              aria-hidden="true"
            >›</span>
          </template>
        </div>
      </section>

      <section v-if="featured.length">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-[15px] font-bold">{{ t('home.recentTournaments') }}</h2>
          <NuxtLink to="/tournaments" class="text-sm font-medium text-brand-400">
            {{ t('home.viewAll') }} ›
          </NuxtLink>
        </div>
        <div
          ref="carouselRef"
          class="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 scrollbar-none"
          @scroll.passive="onCarouselScroll"
        >
          <TournamentCard
            v-for="tournament in featured"
            :key="tournament.id"
            data-tournament-card
            :tournament="tournament"
            layout="featured"
            featured-size="home"
          />
        </div>
        <div class="mt-3 flex items-center justify-center gap-1.5">
          <span
            v-for="(_, index) in featured.slice(0, 6)"
            :key="index"
            class="h-1.5 rounded-full transition-all"
            :class="index === activeSlide ? 'w-5 bg-brand-500' : 'w-1.5 bg-white/20'"
          />
        </div>
      </section>

      <section class="grid grid-cols-3 gap-2">
        <div
          v-for="item in trustItems"
          :key="item.title"
          class="flex flex-col items-center rounded-2xl bg-surface px-2 py-3.5 text-center ring-1 ring-white/[0.06]"
        >
          <div class="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-brand-500/50 text-brand-400">
            <AppIcon :name="item.icon" class="h-4 w-4" />
          </div>
          <div class="w-full text-[10px] font-semibold leading-tight text-white">{{ item.title }}</div>
          <p class="mt-1 w-full text-[9px] leading-snug text-gray-500">{{ item.text }}</p>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-2">
        <NuxtLink
          to="/shop/tshirts"
          class="flex min-h-[48px] items-center gap-2 rounded-xl bg-surface px-3 py-2 text-left text-[13px] font-semibold leading-tight text-white ring-1 ring-white/[0.06] transition active:scale-[0.99]"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
            <AppIcon name="shirt" class="h-4 w-4" />
          </div>
          <span>{{ t('home.quickShirts') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/order-photographer"
          class="flex min-h-[48px] items-center gap-2 rounded-xl bg-surface px-3 py-2 text-left text-[13px] font-semibold leading-tight text-white ring-1 ring-white/[0.06] transition active:scale-[0.99]"
        >
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
            <AppIcon name="camera" class="h-4 w-4" />
          </div>
          <span>{{ t('home.hirePhotographerShort') }}</span>
        </NuxtLink>
      </div>

      <AppSiteFooter class="pb-8" />
    </div>
  </div>
</template>
