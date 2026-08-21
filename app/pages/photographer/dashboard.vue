<script setup lang="ts">
import type { ListResponse, Tournament } from '~/types'

definePageMeta({ middleware: 'photographer-auth', ssr: false })

const { t, locale } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
if (import.meta.client) auth.hydrate()

const data = ref<ListResponse<Tournament[]> | null>(null)
const pending = ref(true)
const loadError = ref(false)
const listMode = ref(false)

async function loadTournaments() {
  if (import.meta.client) auth.hydrate()
  pending.value = true
  loadError.value = false
  try {
    data.value = await api.getMyTournaments()
  }
  catch {
    loadError.value = true
  }
  finally {
    pending.value = false
  }
}

const { data: payouts } = await useAsyncData(
  'photographer-payouts-banner',
  () => api.getPayouts(),
  { server: false },
)

const { data: allStats } = await useAsyncData(
  'photographer-home-stats',
  async () => {
    const list = await api.getMyTournaments()
    const items = list.data ?? []
    const stats = await Promise.all(
      items.slice(0, 12).map(async (item) => {
        try {
          return await api.getTournamentStats(item.id)
        }
        catch {
          return null
        }
      }),
    )
    const revenue = stats.reduce((sum, s) => sum + (s?.revenue ?? 0), 0)
    const photosSold = stats.reduce((sum, s) => sum + (s?.photos_sold ?? 0), 0)
    return { revenue, photosSold, count: items.length }
  },
  { server: false },
)

onMounted(() => {
  loadTournaments()
})

const showPayoutsBanner = computed(() =>
  !!payouts.value?.stripe_configured && !payouts.value.can_receive_payments,
)

const tournaments = computed(() => data.value?.data ?? [])

const tab = ref<'active' | 'completed'>('active')

function isCompleted(item: Tournament) {
  if (!item.date) return false
  const day = new Date(item.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return day < today && item.status === 'published'
}

const activeTournaments = computed(() => tournaments.value.filter(item => !isCompleted(item)))
const completedTournaments = computed(() => tournaments.value.filter(item => isCompleted(item)))
const visibleTournaments = computed(() =>
  tab.value === 'active' ? activeTournaments.value : completedTournaments.value,
)

function statusLabel(item: Tournament) {
  if (item.event_slot_needed) return t('photographer.slotUnpaidBadge')
  if (item.status === 'published') return t('photographer.statusPublished')
  return t('photographer.statusDraft')
}

function statusClass(item: Tournament) {
  if (item.event_slot_needed) return 'bg-amber-500/20 text-amber-300'
  if (item.status === 'published') return 'bg-brand-600/20 text-brand-300'
  return 'bg-white/10 text-gray-400'
}

function formatMoney(n?: number) {
  if (n == null) return '—'
  return `$${n.toFixed(2)}`
}

function formatDate(date?: string) {
  if (!date) return ''
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(date).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
}

async function logout() {
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.dashboardTitle')">
      <template #right>
        <div class="flex items-center gap-2">
          <NuxtLink
            to="/profile/notifications"
            class="flex h-10 w-10 items-center justify-center text-gray-400"
            :aria-label="t('notifications.title')"
          >
            <AppIcon name="bell" class="h-5 w-5" />
          </NuxtLink>
          <button class="text-sm font-medium text-gray-500" @click="logout">{{ t('photographer.logout') }}</button>
        </div>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4">
      <div
        v-if="showPayoutsBanner"
        class="rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-500/25"
      >
        <p class="font-semibold text-amber-200">{{ t('photographer.payoutsBannerTitle') }}</p>
        <p class="mt-1 text-sm text-amber-100/80">{{ t('photographer.payoutsBannerText') }}</p>
        <NuxtLink to="/photographer/payouts" class="btn-primary-solid mt-4">
          {{ t('photographer.payoutsConnect') }}
        </NuxtLink>
      </div>

      <div v-if="!listMode" class="space-y-4">
        <div class="card flex items-center gap-4 p-4">
          <div class="relative">
            <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-600/20 text-brand-400">
              <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url" alt="" class="h-full w-full object-cover">
              <AppIcon v-else name="user" class="h-8 w-8" />
            </div>
            <span class="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-[#151b28]">
              <AppIcon name="camera" class="h-3.5 w-3.5" />
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="truncate text-lg font-bold">{{ auth.user?.name || auth.user?.email }}</h2>
              <span class="rounded-full bg-brand-600/20 px-2 py-0.5 text-[11px] font-semibold text-brand-300">
                {{ t('photographer.cabinetBadge') }}
              </span>
            </div>
            <p class="truncate text-sm text-gray-500">{{ auth.user?.email }}</p>
          </div>
        </div>

        <div class="space-y-3">
          <NuxtLink to="/terms" class="cabinet-row">
            <div class="icon-tile">
              <AppIcon name="sparkles" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ t('photographer.platformTerms') }}</div>
              <div class="text-sm text-gray-500">{{ t('photographer.platformTermsHint') }}</div>
            </div>
            <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-500" />
          </NuxtLink>

          <button type="button" class="cabinet-row w-full text-left" @click="listMode = true">
            <div class="icon-tile">
              <AppIcon name="calendar" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ t('photographer.myTournaments') }}</div>
              <div class="text-sm text-gray-500">{{ t('photographer.myTournamentsHint') }}</div>
            </div>
            <span class="flex h-8 min-w-8 items-center justify-center rounded-full bg-brand-600 px-2 text-sm font-bold text-white">
              {{ allStats?.count ?? tournaments.length }}
            </span>
            <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
          </button>

          <div class="cabinet-row">
            <div class="icon-tile">
              <AppIcon name="chart" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ t('photographer.salesTitle') }}</div>
              <div class="text-sm text-gray-500">{{ t('photographer.salesHint') }}</div>
            </div>
            <div class="text-right">
              <div class="font-bold text-brand-400">{{ formatMoney(allStats?.revenue) }}</div>
              <div class="text-[11px] text-gray-500">{{ t('photographer.earned') }}</div>
            </div>
          </div>

          <NuxtLink to="/photographer/payouts" class="cabinet-row">
            <div class="icon-tile">
              <AppIcon name="wallet" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ t('photographer.payoutsTitle') }}</div>
              <div class="text-sm text-gray-500">{{ t('photographer.payoutsHint') }}</div>
            </div>
            <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
          </NuxtLink>

          <div class="card space-y-3 border-2 border-dashed border-brand-500/40 bg-brand-600/5 p-4">
            <div class="flex items-center gap-3">
              <div class="icon-tile">
                <AppIcon name="plus" class="h-5 w-5" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-semibold">{{ t('photographer.newTournament') }}</div>
                <div class="text-sm text-gray-500">{{ t('photographer.createTournamentHint') }}</div>
              </div>
            </div>
            <NuxtLink to="/photographer/tournaments/new" class="btn-primary-solid">
              {{ t('photographer.createBtn') }}
            </NuxtLink>
          </div>

          <NuxtLink to="/support" class="cabinet-row">
            <div class="icon-tile">
              <AppIcon name="help" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ t('photographer.needHelp') }}</div>
              <div class="text-sm text-gray-500">{{ t('photographer.needHelpHint') }}</div>
            </div>
            <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
          </NuxtLink>
        </div>
      </div>

      <div v-else class="space-y-4">
        <button type="button" class="flex items-center gap-2 text-sm text-brand-400" @click="listMode = false">
          <AppIcon name="back" class="h-4 w-4" />
          {{ t('photographer.dashboardTitle') }}
        </button>

        <h2 class="text-xl font-bold">{{ t('photographer.myTournaments') }}</h2>

        <div class="flex gap-4 border-b border-white/10">
          <button
            class="relative pb-3 text-sm font-semibold"
            :class="tab === 'active' ? 'text-brand-400' : 'text-gray-500'"
            @click="tab = 'active'"
          >
            {{ t('photographer.tabActive') }}
            <span class="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] text-white">{{ activeTournaments.length }}</span>
            <span v-if="tab === 'active'" class="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600" />
          </button>
          <button
            class="relative pb-3 text-sm font-semibold"
            :class="tab === 'completed' ? 'text-brand-400' : 'text-gray-500'"
            @click="tab = 'completed'"
          >
            {{ t('photographer.tabCompleted') }}
            <span class="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">{{ completedTournaments.length }}</span>
            <span v-if="tab === 'completed'" class="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600" />
          </button>
        </div>

        <div v-if="pending" class="space-y-3">
          <div v-for="n in 3" :key="n" class="card h-24 animate-pulse bg-white/10" />
        </div>

        <div v-else-if="loadError" class="card space-y-3 p-6 text-center">
          <AppAlert type="error" :message="t('photographer.loadListFailed')" />
          <button class="btn-primary-solid" @click="loadTournaments()">{{ t('common.retry') }}</button>
        </div>

        <div v-else-if="visibleTournaments.length" class="space-y-3">
          <NuxtLink
            v-for="item in visibleTournaments"
            :key="item.id"
            :to="`/photographer/tournaments/${item.id}`"
            class="card flex gap-3 p-3 transition active:scale-[0.99]"
          >
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
              <AppImage :src="item.cover_image" :alt="item.name" aspect="square" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="font-semibold leading-snug">{{ item.name }}</div>
                <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" :class="statusClass(item)">
                  {{ statusLabel(item) }}
                </span>
              </div>
              <p v-if="item.date" class="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <AppIcon name="calendar" class="h-3.5 w-3.5" />
                {{ formatDate(item.date) }}
              </p>
              <p v-if="item.location" class="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                <AppIcon name="pin" class="h-3.5 w-3.5" />
                {{ item.location }}
              </p>
              <p class="mt-1 text-xs text-gray-500">{{ item.photo_count }} {{ t('common.photos') }}</p>
            </div>
            <span class="mt-3 inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-brand-400 ring-1 ring-brand-500/40">
              <AppIcon :name="item.photo_count ? 'chevron' : 'upload'" class="h-4 w-4" />
              {{ item.photo_count ? t('photographer.openTournament') : t('photographer.addPhotos') }}
            </span>
          </NuxtLink>
        </div>

        <div v-else class="card space-y-4 p-8 text-center">
          <p class="text-gray-400">{{ t('photographer.emptyTournaments') }}</p>
          <NuxtLink to="/photographer/tournaments/new" class="btn-primary-solid">
            {{ t('photographer.createBtn') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
