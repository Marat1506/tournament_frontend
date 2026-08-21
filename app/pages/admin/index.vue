<script setup lang="ts">
import type { Tournament } from '~/types'

definePageMeta({ ssr: false })

const { t } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const toast = useToast()

if (import.meta.client) {
  auth.hydrate()
  if (!auth.isLoggedIn) {
    await navigateTo('/login?redirect=/admin')
  }
  else if (!auth.user) {
    try {
      auth.setUser(await api.me())
    }
    catch {
      auth.logout()
      await navigateTo('/login?redirect=/admin')
    }
  }
  if (auth.isLoggedIn && auth.user?.role !== 'admin') {
    await navigateTo('/')
  }
}

type Tab = 'overview' | 'settings' | 'tournaments' | 'leads' | 'orders' | 'users'
const tab = ref<Tab>('overview')
const statusFilter = ref('')
const typeFilter = ref('')
const userStatusFilter = ref('')

const { data: stats, refresh: refreshStats, pending: statsPending } = await useAsyncData('admin-stats', () => api.getAdminStats(), { server: false })
const { data: settings, refresh: refreshSettings, pending: settingsPending } = await useAsyncData('admin-settings', () => api.getAdminSettings(), { server: false })
const { data: tournaments, refresh: refreshTournaments, pending: tournamentsPending } = await useAsyncData('admin-tournaments', () => api.getAdminTournaments(), { server: false })
const { data: users, refresh: refreshUsers, pending: usersPending } = await useAsyncData(
  () => `admin-users-${userStatusFilter.value}`,
  () => api.getAdminUsers({
    role: userStatusFilter.value === 'photographers_pending' ? 'photographer' : undefined,
    status: userStatusFilter.value === 'photographers_pending' ? 'pending' : userStatusFilter.value || undefined,
  }),
  { watch: [userStatusFilter], server: false },
)
const { data: orders, pending: ordersPending } = await useAsyncData('admin-orders', () => api.getAdminOrders(), { server: false })

const { data: leads, refresh: refreshLeads, pending: leadsPending } = await useAsyncData(
  () => `admin-leads-${statusFilter.value}-${typeFilter.value}`,
  () => api.getAdminLeads({ status: statusFilter.value || undefined, type: typeFilter.value || undefined }),
  { watch: [statusFilter, typeFilter], server: false },
)

const MIN_PHOTO_PRICE = 10

const priceSingle = ref(20)
const priceBundle = ref(50)
const priceSingleInput = ref<HTMLInputElement | null>(null)
const priceBundleInput = ref<HTMLInputElement | null>(null)
const settingsSaving = ref(false)
const heroUploading = ref(false)
const heroRemoving = ref(false)
const heroInput = ref<HTMLInputElement | null>(null)
const hasHeroPreview = computed(() => !!settings.value?.hero_image_url)

watch(settings, (s) => {
  if (s) {
    priceSingle.value = s.default_price_single
    priceBundle.value = s.default_price_bundle
  }
}, { immediate: true })

const tabs = computed(() => [
  { id: 'overview' as Tab, label: t('admin.tabOverview') },
  { id: 'settings' as Tab, label: t('admin.tabSettings') },
  { id: 'tournaments' as Tab, label: t('admin.tabTournaments') },
  { id: 'leads' as Tab, label: t('admin.tabLeads') },
  { id: 'orders' as Tab, label: t('admin.tabOrders') },
  { id: 'users' as Tab, label: t('admin.tabUsers') },
])

const statusLabels = computed<Record<string, string>>(() => ({
  new: t('admin.leadStatusNew'),
  contacted: t('admin.leadStatusContacted'),
  closed: t('admin.leadStatusClosed'),
  draft: t('admin.tournamentStatusDraft'),
  published: t('admin.tournamentStatusPublished'),
  paid: t('admin.orderStatusPaid'),
  pending: t('admin.orderStatusPending'),
  failed: t('admin.orderStatusFailed'),
  cancelled: t('admin.orderStatusCancelled'),
}))

const userStatusLabels = computed<Record<string, string>>(() => ({
  pending: t('admin.userStatusPending'),
  approved: t('admin.userStatusApproved'),
  rejected: t('admin.userStatusRejected'),
}))

const stripeStatusLabels = computed<Record<string, string>>(() => ({
  not_started: t('admin.stripeNotStarted'),
  onboarding: t('admin.stripeOnboarding'),
  restricted: t('admin.stripeRestricted'),
  active: t('admin.stripeActive'),
  disabled: t('admin.stripeDisabled'),
}))

const typeLabels = computed<Record<string, string>>(() => ({
  tshirt: t('admin.leadTypeTshirt'),
  hire_photographer: t('admin.leadTypePhotographer'),
}))

const roleLabels = computed<Record<string, string>>(() => ({
  client: t('admin.roleClient'),
  photographer: t('admin.rolePhotographer'),
  admin: t('admin.roleAdmin'),
}))

const editingTournament = ref<Tournament | null>(null)
const editPriceSingle = ref(0)
const editPriceBundle = ref(0)
const editPriceSingleInput = ref<HTMLInputElement | null>(null)
const editPriceBundleInput = ref<HTMLInputElement | null>(null)
const editStatus = ref('published')
const tournamentSaving = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)
const coverTargetId = ref<string | null>(null)
const coverUploadingId = ref<string | null>(null)
const userActionId = ref<string | null>(null)
const userActionStatus = ref<string | null>(null)
const leadActionId = ref<string | null>(null)
const leadActionStatus = ref<string | null>(null)

const priceSingleError = computed(() =>
  priceSingle.value < MIN_PHOTO_PRICE
    ? t('admin.priceSingleMin', { min: MIN_PHOTO_PRICE })
    : '',
)
const priceBundleError = computed(() => {
  if (priceBundle.value < MIN_PHOTO_PRICE) {
    return t('admin.priceBundleMin', { min: MIN_PHOTO_PRICE })
  }
  if (priceBundle.value < priceSingle.value) {
    return t('admin.priceBundleMinSingle')
  }
  return ''
})
const editPriceSingleError = computed(() =>
  editPriceSingle.value < MIN_PHOTO_PRICE
    ? t('admin.priceSingleMin', { min: MIN_PHOTO_PRICE })
    : '',
)
const editPriceBundleError = computed(() => {
  if (editPriceBundle.value < MIN_PHOTO_PRICE) {
    return t('admin.priceBundleMin', { min: MIN_PHOTO_PRICE })
  }
  if (editPriceBundle.value < editPriceSingle.value) {
    return t('admin.priceBundleMinSingle')
  }
  return ''
})
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU')
}

function adminErrorMessage(e: unknown) {
  return t(getCommonApiErrorKey(e) ?? 'admin.saveFailed')
}

function validatePrices(single: number, bundle: number) {
  if (single < MIN_PHOTO_PRICE || bundle < MIN_PHOTO_PRICE) {
    return false
  }
  if (bundle < single) {
    return false
  }
  return true
}

async function saveSettings() {
  if (!validatePrices(priceSingle.value, priceBundle.value)) {
    await nextTick()
    if (priceSingleError.value) priceSingleInput.value?.focus()
    else priceBundleInput.value?.focus()
    return
  }
  settingsSaving.value = true
  try {
    await api.updateAdminSettings({
      default_price_single: priceSingle.value,
      default_price_bundle: priceBundle.value,
    })
    await refreshSettings()
    toast.success(t('admin.savedOk'))
  } catch (e: unknown) {
    toast.error(adminErrorMessage(e))
  } finally {
    settingsSaving.value = false
  }
}

async function onHeroSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  heroUploading.value = true
  try {
    await api.uploadAdminHero(file)
    await refreshSettings()
    toast.success(t('admin.heroUploaded'))
  } catch (err: unknown) {
    toast.error(adminErrorMessage(err))
  } finally {
    heroUploading.value = false
    if (heroInput.value) heroInput.value.value = ''
  }
}

async function removeHero() {
  heroRemoving.value = true
  try {
    await api.clearAdminHero()
    await refreshSettings()
    toast.success(t('admin.heroRemoved'))
  } catch (err: unknown) {
    toast.error(adminErrorMessage(err))
  } finally {
    heroRemoving.value = false
  }
}

function openEditTournament(t: Tournament) {
  editingTournament.value = t
  editPriceSingle.value = t.price_single
  editPriceBundle.value = t.price_bundle
  editStatus.value = t.status
}

async function saveTournament() {
  if (!editingTournament.value) return
  if (!validatePrices(editPriceSingle.value, editPriceBundle.value)) {
    await nextTick()
    if (editPriceSingleError.value) editPriceSingleInput.value?.focus()
    else editPriceBundleInput.value?.focus()
    return
  }
  tournamentSaving.value = true
  try {
    await api.updateAdminTournament(editingTournament.value.id, {
      price_single: editPriceSingle.value,
      price_bundle: editPriceBundle.value,
      status: editStatus.value,
    })
    editingTournament.value = null
    await refreshTournaments()
    await refreshStats()
    toast.success(t('admin.savedOk'))
  } catch (e: unknown) {
    toast.error(adminErrorMessage(e))
  } finally {
    tournamentSaving.value = false
  }
}

function triggerCoverUpload(id: string) {
  if (coverUploadingId.value) return
  coverTargetId.value = id
  coverInput.value?.click()
}

async function onCoverSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !coverTargetId.value) return
  const tournamentId = coverTargetId.value
  coverUploadingId.value = tournamentId
  try {
    await api.uploadAdminTournamentCover(tournamentId, file)
    await refreshTournaments()
    toast.success(t('admin.savedOk'))
  } catch (err: unknown) {
    toast.error(adminErrorMessage(err))
  } finally {
    coverUploadingId.value = null
    coverTargetId.value = null
    if (coverInput.value) coverInput.value.value = ''
  }
}

async function setLeadStatus(id: string, status: string) {
  if (leadActionId.value) return
  leadActionId.value = id
  leadActionStatus.value = status
  try {
    await api.updateLeadStatus(id, status)
    await refreshLeads()
    await refreshStats()
  } catch (e: unknown) {
    toast.error(adminErrorMessage(e))
  } finally {
    leadActionId.value = null
    leadActionStatus.value = null
  }
}

async function setUserStatus(id: string, status: string) {
  if (userActionId.value) return
  userActionId.value = id
  userActionStatus.value = status
  try {
    await api.updateAdminUserStatus(id, status)
    await refreshUsers()
    await refreshStats()
    toast.success(t('admin.savedOk'))
  } catch (e: unknown) {
    toast.error(adminErrorMessage(e))
  } finally {
    userActionId.value = null
    userActionStatus.value = null
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('admin.title')">
      <template #right>
        <NuxtLink to="/profile" class="text-sm text-gray-500">{{ t('admin.profileLink') }}</NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="tabItem in tabs"
          :key="tabItem.id"
          class="min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
          :class="tab === tabItem.id ? 'chip-active' : 'chip-inactive'"
          @click="tab = tabItem.id"
        >
          {{ tabItem.label }}
        </button>
      </div>

      <!-- Overview -->
      <div v-if="tab === 'overview' && statsPending" class="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy="true">
        <div v-for="n in 6" :key="n" class="card h-24 animate-pulse bg-white/10" />
        <span class="sr-only">{{ t('common.loading') }}</span>
      </div>
      <div v-else-if="tab === 'overview' && stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-brand-400">{{ stats.leads_new }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statLeadsNew') }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold">{{ stats.tournaments }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statTournaments') }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold">{{ stats.photos }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statPhotos') }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold">{{ stats.users }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statUsers') }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold">{{ stats.orders }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statOrders') }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-amber-400">{{ stats.photographers_pending ?? 0 }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statPhotographersPending') }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold">{{ stats.leads_total }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statLeadsTotal') }}</div>
        </div>
      </div>

      <!-- Settings -->
      <div v-if="tab === 'settings'" class="space-y-4">
        <div v-if="settingsPending" class="space-y-4" aria-busy="true">
          <div class="card h-64 animate-pulse bg-white/10" />
          <div class="card h-64 animate-pulse bg-white/10" />
          <span class="sr-only">{{ t('common.loading') }}</span>
        </div>
        <template v-else>
          <div class="card space-y-4 p-4">
            <h3 class="font-semibold">{{ t('admin.homePage') }}</h3>
            <p class="text-sm text-gray-500">{{ t('admin.homePageHint') }}</p>
            <div v-if="hasHeroPreview" class="h-40 overflow-hidden rounded-xl">
              <AppImage :src="settings?.hero_image_url" aspect="cover" alt="Hero preview" />
            </div>
            <div
              v-else
              class="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 px-4 text-center text-sm text-gray-500"
            >
              {{ t('admin.heroEmpty') }}
            </div>
            <input ref="heroInput" type="file" accept="image/*" class="hidden" @change="onHeroSelected">
            <div class="flex flex-wrap gap-2">
              <button class="btn-primary-solid" :disabled="heroUploading || heroRemoving" @click="heroInput?.click()">
                {{ heroUploading ? t('admin.uploading') : t('admin.uploadPreview') }}
              </button>
              <button
                v-if="hasHeroPreview"
                type="button"
                class="btn-secondary"
                :disabled="heroUploading || heroRemoving"
                @click="removeHero"
              >
                {{ heroRemoving ? t('admin.removing') : t('admin.removePreview') }}
              </button>
            </div>
          </div>

          <div class="card space-y-4 p-4">
            <h3 class="font-semibold">{{ t('admin.defaultPrices') }}</h3>
            <p class="text-sm text-gray-500">{{ t('admin.defaultPricesHint') }}</p>
            <label class="block text-sm">
              <span class="text-gray-400">{{ t('admin.priceOnePhoto') }}</span>
              <input
                ref="priceSingleInput"
                v-model.number="priceSingle"
                type="number"
                :min="MIN_PHOTO_PRICE"
                step="0.01"
                class="input-field mt-1"
                :class="{ 'input-field-error': priceSingleError }"
                :aria-invalid="!!priceSingleError"
                :aria-describedby="priceSingleError ? 'default-price-single-error' : undefined"
              >
              <span v-if="priceSingleError" id="default-price-single-error" class="field-error block">
                {{ priceSingleError }}
              </span>
              <span v-else class="mt-1.5 block text-xs text-gray-500">
                {{ t('admin.priceMinHint', { min: MIN_PHOTO_PRICE }) }}
              </span>
            </label>
            <label class="block text-sm">
              <span class="text-gray-400">{{ t('admin.priceAllPhotos') }}</span>
              <input
                ref="priceBundleInput"
                v-model.number="priceBundle"
                type="number"
                :min="MIN_PHOTO_PRICE"
                step="0.01"
                class="input-field mt-1"
                :class="{ 'input-field-error': priceBundleError }"
                :aria-invalid="!!priceBundleError"
                :aria-describedby="priceBundleError ? 'default-price-bundle-error' : undefined"
              >
              <span v-if="priceBundleError" id="default-price-bundle-error" class="field-error block">
                {{ priceBundleError }}
              </span>
            </label>
            <button class="btn-primary-solid" :disabled="settingsSaving" @click="saveSettings">
              <span v-if="settingsSaving" class="loading-spinner" aria-hidden="true" />
              {{ settingsSaving ? t('settings.saving') : t('admin.savePrices') }}
            </button>
          </div>
        </template>
      </div>

      <!-- Tournaments -->
      <div v-if="tab === 'tournaments'" class="space-y-3">
        <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverSelected">
        <p class="text-sm text-gray-500">{{ t('admin.tournamentsHint') }}</p>
        <div v-if="tournamentsPending" class="space-y-3" aria-busy="true">
          <div v-for="n in 3" :key="n" class="card h-32 animate-pulse bg-white/10" />
          <span class="sr-only">{{ t('common.loading') }}</span>
        </div>
        <div v-for="tournament in tournamentsPending ? [] : tournaments?.data" :key="tournament.id" class="card p-4">
          <div class="flex gap-3">
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <AppImage :src="tournament.cover_image" aspect="square" :alt="tournament.name" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ tournament.name }}</div>
              <div class="text-xs text-gray-500">
                {{ tournament.slug }} · {{ tournament.photo_count }} {{ t('common.photos') }} ·
                <span :class="tournament.status === 'published' ? 'text-green-400' : 'text-gray-400'">
                  {{ statusLabels[tournament.status] || t('admin.statusUnknown') }}
                </span>
              </div>
              <div class="mt-1 text-sm">${{ tournament.price_single }} / ${{ tournament.price_bundle }}</div>
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <button class="inline-flex min-h-11 items-center rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs font-medium text-brand-400" @click="openEditTournament(tournament)">
              {{ t('admin.pricesAndStatus') }}
            </button>
            <button
              class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300"
              :disabled="coverUploadingId !== null"
              @click="triggerCoverUpload(tournament.id)"
            >
              <span v-if="coverUploadingId === tournament.id" class="loading-spinner" aria-hidden="true" />
              {{ coverUploadingId === tournament.id ? t('common.loading') : t('admin.cover') }}
            </button>
            <NuxtLink
              v-if="tournament.status === 'published'"
              :to="`/tournaments/${tournament.slug}`"
              class="inline-flex min-h-11 items-center rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300"
            >
              {{ t('admin.open') }}
            </NuxtLink>
          </div>
        </div>
        <p v-if="!tournamentsPending && !tournaments?.data?.length" class="text-center text-gray-500">{{ t('admin.noTournaments') }}</p>
      </div>

      <!-- Leads -->
      <div v-if="tab === 'leads'" class="space-y-4">
        <p class="text-sm text-gray-500">{{ t('admin.leadsHint') }}</p>
        <div class="flex flex-wrap gap-2">
          <select v-model="typeFilter" class="input-field min-h-11 w-auto min-w-[140px]">
            <option value="">{{ t('admin.allTypes') }}</option>
            <option value="tshirt">{{ t('admin.leadTypeTshirt') }}</option>
            <option value="hire_photographer">{{ t('admin.leadTypePhotographer') }}</option>
          </select>
          <select v-model="statusFilter" class="input-field min-h-11 w-auto min-w-[140px]">
            <option value="">{{ t('admin.allStatuses') }}</option>
            <option value="new">{{ t('admin.leadsNew') }}</option>
            <option value="contacted">{{ t('admin.leadStatusContacted') }}</option>
            <option value="closed">{{ t('admin.leadsClosed') }}</option>
          </select>
        </div>
        <div v-if="leadsPending" class="space-y-3" aria-busy="true">
          <div v-for="n in 3" :key="n" class="card h-24 animate-pulse bg-white/10" />
          <span class="sr-only">{{ t('common.loading') }}</span>
        </div>
        <div v-else-if="leads?.data?.length" class="space-y-3">
          <div v-for="lead in leads.data" :key="lead.id" class="card space-y-3 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-semibold">{{ lead.name }}</div>
                <div class="text-sm text-gray-500">{{ lead.email }} · {{ typeLabels[lead.type] || t('admin.leadTypeUnknown') }}</div>
                <div class="text-xs text-gray-400">{{ formatDate(lead.created_at) }}</div>
              </div>
              <span class="rounded-full px-2 py-1 text-xs font-medium" :class="{
                'bg-yellow-500/20 text-yellow-400': lead.status === 'new',
                'bg-blue-500/20 text-blue-400': lead.status === 'contacted',
                'bg-white/10 text-gray-400': lead.status === 'closed',
              }">
                {{ statusLabels[lead.status] || t('admin.statusUnknown') }}
              </span>
            </div>
            <div v-if="lead.phone" class="text-sm">
              <a :href="`tel:${lead.phone}`" class="text-brand-400">{{ lead.phone }}</a>
            </div>
            <div class="text-sm">
              <a :href="`mailto:${lead.email}`" class="text-brand-400">{{ lead.email }}</a>
            </div>
            <div v-if="lead.shirt_size" class="text-sm text-gray-400">{{ t('admin.leadShirtSize') }}: {{ lead.shirt_size }}</div>
            <div v-if="lead.event_date" class="text-sm text-gray-400">{{ t('admin.leadEventDate') }}: {{ lead.event_date }}</div>
            <div v-if="lead.event_location" class="text-sm text-gray-400">{{ t('admin.leadEventLocation') }}: {{ lead.event_location }}</div>
            <NuxtLink
              v-if="lead.photo_id"
              :to="`/photos/${lead.photo_id}`"
              class="text-sm font-medium text-brand-400"
            >
              {{ t('admin.leadPhoto') }}
            </NuxtLink>
            <div v-if="lead.message" class="text-sm text-gray-400">{{ lead.message }}</div>
            <div class="flex gap-2">
              <button
                v-if="lead.status === 'new'"
                class="min-h-11 rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400"
                :disabled="leadActionId !== null"
                @click="setLeadStatus(lead.id, 'contacted')"
              >
                <span v-if="leadActionId === lead.id && leadActionStatus === 'contacted'" class="loading-spinner mr-2 inline-block align-middle" aria-hidden="true" />
                {{ leadActionId === lead.id && leadActionStatus === 'contacted' ? t('common.loading') : t('admin.markContacted') }}
              </button>
              <button
                v-if="lead.status !== 'closed'"
                class="min-h-11 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300"
                :disabled="leadActionId !== null"
                @click="setLeadStatus(lead.id, 'closed')"
              >
                <span v-if="leadActionId === lead.id && leadActionStatus === 'closed'" class="loading-spinner mr-2 inline-block align-middle" aria-hidden="true" />
                {{ leadActionId === lead.id && leadActionStatus === 'closed' ? t('common.loading') : t('admin.closeLead') }}
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-center text-gray-500">{{ t('admin.noLeads') }}</p>
      </div>

      <!-- Orders -->
      <div v-if="tab === 'orders'" class="space-y-3">
        <p class="text-sm text-gray-500">{{ t('admin.ordersHint') }}</p>
        <div v-if="ordersPending" class="space-y-3" aria-busy="true">
          <div v-for="n in 3" :key="n" class="card h-24 animate-pulse bg-white/10" />
          <span class="sr-only">{{ t('common.loading') }}</span>
        </div>
        <div v-for="order in ordersPending ? [] : orders?.data" :key="order.id" class="card flex items-center justify-between p-4">
          <div>
            <div class="font-medium">#{{ order.id.slice(0, 8) }}</div>
            <div class="text-sm text-gray-500">{{ order.guest_email || t('admin.accountGuest') }}</div>
            <div class="text-xs text-gray-400">{{ formatDate(order.created_at) }}</div>
          </div>
          <div class="text-right">
            <div class="font-semibold">${{ order.total }}</div>
            <div class="text-xs" :class="order.status === 'paid' ? 'text-green-400' : 'text-gray-500'">
              {{ statusLabels[order.status] || t('admin.statusUnknown') }}
            </div>
          </div>
        </div>
        <p v-if="!ordersPending && !orders?.data?.length" class="text-center text-gray-500">{{ t('admin.noOrders') }}</p>
      </div>

      <!-- Users -->
      <div v-if="tab === 'users'" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="min-h-11 rounded-full px-3 py-1 text-sm"
            :class="!userStatusFilter ? 'bg-brand-600/20 text-brand-300' : 'bg-white/10 text-gray-400'"
            @click="userStatusFilter = ''"
          >
            {{ t('admin.userFilterAll') }}
          </button>
          <button
            type="button"
            class="min-h-11 rounded-full px-3 py-1 text-sm"
            :class="userStatusFilter === 'photographers_pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-white/10 text-gray-400'"
            @click="userStatusFilter = 'photographers_pending'"
          >
            {{ t('admin.userFilterPendingPhotographers') }}
          </button>
        </div>
        <p class="text-sm text-gray-500">{{ t('admin.usersHint') }}</p>
        <div v-if="usersPending" class="space-y-3" aria-busy="true">
          <div v-for="n in 3" :key="n" class="card h-28 animate-pulse bg-white/10" />
          <span class="sr-only">{{ t('common.loading') }}</span>
        </div>
        <div v-for="user in usersPending ? [] : users?.data" :key="user.id" class="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="font-medium">{{ user.name || user.email }}</div>
            <div class="text-sm text-gray-500">{{ user.email }}</div>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <div class="text-right sm:mr-2">
              <div class="text-sm font-medium">{{ roleLabels[user.role] || t('admin.roleUnknown') }}</div>
              <div v-if="user.role === 'photographer'" class="space-y-0.5 text-xs">
                <div :class="user.status === 'pending' ? 'text-amber-400' : user.status === 'rejected' ? 'text-red-400' : 'text-green-400'">
                  {{ userStatusLabels[user.status] || t('admin.statusUnknown') }}
                </div>
                <div :class="user.email_verified ? 'text-green-400' : 'text-amber-400'">
                  {{ user.email_verified ? t('admin.emailVerified') : t('admin.emailNotVerified') }}
                </div>
                <div v-if="user.stripe_status" :class="user.stripe_status === 'active' ? 'text-green-400' : 'text-gray-400'">
                  {{ t('admin.stripeLabel') }}: {{ stripeStatusLabels[user.stripe_status] || t('admin.stripeUnknown') }}
                </div>
              </div>
              <div v-else class="text-xs text-gray-400">{{ formatDate(user.created_at) }}</div>
            </div>
            <template v-if="user.role === 'photographer' && user.status === 'pending' && user.email_verified">
              <button
                type="button"
                class="min-h-11 btn-primary-solid px-3 py-1.5 text-sm"
                :disabled="userActionId !== null"
                @click="setUserStatus(user.id, 'approved')"
              >
                <span v-if="userActionId === user.id && userActionStatus === 'approved'" class="loading-spinner" aria-hidden="true" />
                {{ userActionId === user.id && userActionStatus === 'approved' ? t('common.loading') : t('admin.approvePhotographer') }}
              </button>
              <button
                type="button"
                class="min-h-11 btn-secondary px-3 py-1.5 text-sm"
                :disabled="userActionId !== null"
                @click="setUserStatus(user.id, 'rejected')"
              >
                <span v-if="userActionId === user.id && userActionStatus === 'rejected'" class="loading-spinner" aria-hidden="true" />
                {{ userActionId === user.id && userActionStatus === 'rejected' ? t('common.loading') : t('admin.rejectPhotographer') }}
              </button>
            </template>
            <button
              v-else-if="user.role === 'photographer' && user.status === 'rejected' && user.email_verified"
              type="button"
              class="min-h-11 btn-secondary px-3 py-1.5 text-sm"
              :disabled="userActionId !== null"
              @click="setUserStatus(user.id, 'approved')"
            >
              <span v-if="userActionId === user.id" class="loading-spinner" aria-hidden="true" />
              {{ userActionId === user.id ? t('common.loading') : t('admin.approvePhotographer') }}
            </button>
          </div>
        </div>
        <p v-if="!usersPending && !users?.data?.length" class="text-center text-gray-500">{{ t('admin.noUsers') }}</p>
      </div>
    </div>

    <!-- Tournament edit modal -->
    <Teleport to="body">
      <div
        v-if="editingTournament"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        @click.self="editingTournament = null"
      >
        <div class="card w-full max-w-md space-y-4 p-5">
          <h3 class="font-semibold">{{ editingTournament.name }}</h3>
          <label class="block text-sm">
            <span class="text-gray-400">{{ t('admin.priceSingle') }}</span>
            <input
              ref="editPriceSingleInput"
              v-model.number="editPriceSingle"
              type="number"
              :min="MIN_PHOTO_PRICE"
              step="0.01"
              class="input-field mt-1"
              :class="{ 'input-field-error': editPriceSingleError }"
              :aria-invalid="!!editPriceSingleError"
            >
            <span v-if="editPriceSingleError" class="field-error block">{{ editPriceSingleError }}</span>
          </label>
          <label class="block text-sm">
            <span class="text-gray-400">{{ t('admin.priceBundle') }}</span>
            <input
              ref="editPriceBundleInput"
              v-model.number="editPriceBundle"
              type="number"
              :min="MIN_PHOTO_PRICE"
              step="0.01"
              class="input-field mt-1"
              :class="{ 'input-field-error': editPriceBundleError }"
              :aria-invalid="!!editPriceBundleError"
            >
            <span v-if="editPriceBundleError" class="field-error block">{{ editPriceBundleError }}</span>
          </label>
          <label class="block text-sm">
            <span class="text-gray-400">{{ t('admin.statusLabel') }}</span>
            <select v-model="editStatus" class="input-field mt-1">
              <option value="published">{{ t('admin.tournamentStatusPublished') }}</option>
              <option value="draft">{{ t('admin.statusHidden') }}</option>
            </select>
          </label>
          <div class="flex gap-2">
            <button class="btn-primary-solid flex-1" :disabled="tournamentSaving" @click="saveTournament">
              <span v-if="tournamentSaving" class="loading-spinner" aria-hidden="true" />
              {{ tournamentSaving ? t('settings.saving') : t('common.save') }}
            </button>
            <button class="rounded-2xl px-4 py-3 text-sm font-medium text-gray-400 ring-1 ring-white/10" @click="editingTournament = null">
              {{ t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
