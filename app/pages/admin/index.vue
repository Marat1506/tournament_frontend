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

const { data: stats, refresh: refreshStats } = await useAsyncData('admin-stats', () => api.getAdminStats(), { server: false })
const { data: settings, refresh: refreshSettings } = await useAsyncData('admin-settings', () => api.getAdminSettings(), { server: false })
const { data: tournaments, refresh: refreshTournaments } = await useAsyncData('admin-tournaments', () => api.getAdminTournaments(), { server: false })
const { data: users, refresh: refreshUsers } = await useAsyncData(
  () => `admin-users-${userStatusFilter.value}`,
  () => api.getAdminUsers({
    role: userStatusFilter.value === 'photographers_pending' ? 'photographer' : undefined,
    status: userStatusFilter.value === 'photographers_pending' ? 'pending' : userStatusFilter.value || undefined,
  }),
  { watch: [userStatusFilter], server: false },
)
const { data: orders } = await useAsyncData('admin-orders', () => api.getAdminOrders(), { server: false })

const { data: leads, refresh: refreshLeads, pending: leadsPending } = await useAsyncData(
  () => `admin-leads-${statusFilter.value}-${typeFilter.value}`,
  () => api.getAdminLeads({ status: statusFilter.value || undefined, type: typeFilter.value || undefined }),
  { watch: [statusFilter, typeFilter], server: false },
)

const priceSingle = ref(20)
const priceBundle = ref(50)
const settingsSaving = ref(false)
const heroUploading = ref(false)
const heroInput = ref<HTMLInputElement | null>(null)
const heroPreviewSrc = computed(() => settings.value?.hero_image_url || '/main_background_mobile.png')

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
const editStatus = ref('published')
const tournamentSaving = ref(false)
const coverInput = ref<HTMLInputElement | null>(null)
const coverTargetId = ref<string | null>(null)

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU')
}

function adminErrorMessage(e: unknown) {
  return getApiErrorMessage(e) || t('admin.saveFailed')
}

async function saveSettings() {
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
    await refreshNuxtData('platform-home')
    toast.success(t('admin.heroUploaded'))
  } catch (err: unknown) {
    toast.error(adminErrorMessage(err))
  } finally {
    heroUploading.value = false
    if (heroInput.value) heroInput.value.value = ''
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
  coverTargetId.value = id
  coverInput.value?.click()
}

async function onCoverSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !coverTargetId.value) return
  try {
    await api.uploadAdminTournamentCover(coverTargetId.value, file)
    await refreshTournaments()
    toast.success(t('admin.savedOk'))
  } catch (err: unknown) {
    toast.error(adminErrorMessage(err))
  } finally {
    coverTargetId.value = null
    if (coverInput.value) coverInput.value.value = ''
  }
}

async function setLeadStatus(id: string, status: string) {
  try {
    await api.updateLeadStatus(id, status)
    await refreshLeads()
    await refreshStats()
  } catch (e: unknown) {
    toast.error(adminErrorMessage(e))
  }
}

async function setUserStatus(id: string, status: string) {
  try {
    await api.updateAdminUserStatus(id, status)
    await refreshUsers()
    await refreshStats()
    toast.success(t('admin.savedOk'))
  } catch (e: unknown) {
    toast.error(adminErrorMessage(e))
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
          class="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
          :class="tab === tabItem.id ? 'chip-active' : 'chip-inactive'"
          @click="tab = tabItem.id"
        >
          {{ tabItem.label }}
        </button>
      </div>

      <!-- Overview -->
      <div v-if="tab === 'overview' && stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-brand-600">{{ stats.leads_new }}</div>
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
          <div class="text-2xl font-bold text-amber-600">{{ stats.photographers_pending ?? 0 }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statPhotographersPending') }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold">{{ stats.leads_total }}</div>
          <div class="text-xs text-gray-500">{{ t('admin.statLeadsTotal') }}</div>
        </div>
      </div>

      <!-- Settings -->
      <div v-if="tab === 'settings'" class="space-y-4">
        <div class="card space-y-4 p-4">
          <h3 class="font-semibold">{{ t('admin.homePage') }}</h3>
          <p class="text-sm text-gray-500">{{ t('admin.homePageHint') }}</p>
          <div class="h-40 overflow-hidden rounded-xl">
            <AppImage :src="heroPreviewSrc" aspect="cover" alt="Hero preview" />
          </div>
          <input ref="heroInput" type="file" accept="image/*" class="hidden" @change="onHeroSelected">
          <button class="btn-primary-solid" :disabled="heroUploading" @click="heroInput?.click()">
            {{ heroUploading ? t('admin.uploading') : t('admin.uploadPreview') }}
          </button>
        </div>

        <div class="card space-y-4 p-4">
          <h3 class="font-semibold">{{ t('admin.defaultPrices') }}</h3>
          <p class="text-sm text-gray-500">{{ t('admin.defaultPricesHint') }}</p>
          <label class="block text-sm">
            <span class="text-gray-600">{{ t('admin.priceOnePhoto') }}</span>
            <input v-model.number="priceSingle" type="number" min="1" step="0.01" class="input-field mt-1">
          </label>
          <label class="block text-sm">
            <span class="text-gray-600">{{ t('admin.priceAllPhotos') }}</span>
            <input v-model.number="priceBundle" type="number" min="1" step="0.01" class="input-field mt-1">
          </label>
          <button class="btn-primary-solid" :disabled="settingsSaving" @click="saveSettings">
            {{ settingsSaving ? t('settings.saving') : t('admin.savePrices') }}
          </button>
        </div>
      </div>

      <!-- Tournaments -->
      <div v-if="tab === 'tournaments'" class="space-y-3">
        <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverSelected">
        <p class="text-sm text-gray-500">{{ t('admin.tournamentsHint') }}</p>
        <div v-for="tournament in tournaments?.data" :key="tournament.id" class="card p-4">
          <div class="flex gap-3">
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
              <AppImage :src="tournament.cover_image" aspect="square" :alt="tournament.name" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="font-semibold">{{ tournament.name }}</div>
              <div class="text-xs text-gray-500">
                {{ tournament.slug }} · {{ tournament.photo_count }} {{ t('common.photos') }} ·
                <span :class="tournament.status === 'published' ? 'text-green-600' : 'text-gray-400'">
                  {{ statusLabels[tournament.status] || tournament.status }}
                </span>
              </div>
              <div class="mt-1 text-sm">${{ tournament.price_single }} / ${{ tournament.price_bundle }}</div>
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <button class="rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs font-medium text-brand-400" @click="openEditTournament(tournament)">
              {{ t('admin.pricesAndStatus') }}
            </button>
            <button class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300" @click="triggerCoverUpload(tournament.id)">
              {{ t('admin.cover') }}
            </button>
            <NuxtLink
              v-if="tournament.status === 'published'"
              :to="`/tournaments/${tournament.slug}`"
              class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300"
            >
              {{ t('admin.open') }}
            </NuxtLink>
          </div>
        </div>
        <p v-if="!tournaments?.data?.length" class="text-center text-gray-500">{{ t('admin.noTournaments') }}</p>
      </div>

      <!-- Leads -->
      <div v-if="tab === 'leads'" class="space-y-4">
        <p class="text-sm text-gray-500">{{ t('admin.leadsHint') }}</p>
        <div class="flex flex-wrap gap-2">
          <select v-model="typeFilter" class="input-field w-auto min-w-[140px]">
            <option value="">{{ t('admin.allTypes') }}</option>
            <option value="tshirt">{{ t('admin.leadTypeTshirt') }}</option>
            <option value="hire_photographer">{{ t('admin.leadTypePhotographer') }}</option>
          </select>
          <select v-model="statusFilter" class="input-field w-auto min-w-[140px]">
            <option value="">{{ t('admin.allStatuses') }}</option>
            <option value="new">{{ t('admin.leadsNew') }}</option>
            <option value="contacted">{{ t('admin.leadStatusContacted') }}</option>
            <option value="closed">{{ t('admin.leadsClosed') }}</option>
          </select>
        </div>
        <div v-if="leadsPending" class="space-y-3">
          <div v-for="n in 3" :key="n" class="card h-24 animate-pulse bg-white/10" />
        </div>
        <div v-else-if="leads?.data?.length" class="space-y-3">
          <div v-for="lead in leads.data" :key="lead.id" class="card space-y-3 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-semibold">{{ lead.name }}</div>
                <div class="text-sm text-gray-500">{{ lead.email }} · {{ typeLabels[lead.type] || lead.type }}</div>
                <div class="text-xs text-gray-400">{{ formatDate(lead.created_at) }}</div>
              </div>
              <span class="rounded-full px-2 py-1 text-xs font-medium" :class="{
                'bg-yellow-500/20 text-yellow-400': lead.status === 'new',
                'bg-blue-500/20 text-blue-400': lead.status === 'contacted',
                'bg-white/10 text-gray-400': lead.status === 'closed',
              }">
                {{ statusLabels[lead.status] || lead.status }}
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
                class="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-medium text-blue-400"
                @click="setLeadStatus(lead.id, 'contacted')"
              >
                {{ t('admin.markContacted') }}
              </button>
              <button
                v-if="lead.status !== 'closed'"
                class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-300"
                @click="setLeadStatus(lead.id, 'closed')"
              >
                {{ t('admin.closeLead') }}
              </button>
            </div>
          </div>
        </div>
        <p v-else class="text-center text-gray-500">{{ t('admin.noLeads') }}</p>
      </div>

      <!-- Orders -->
      <div v-if="tab === 'orders'" class="space-y-3">
        <p class="text-sm text-gray-500">{{ t('admin.ordersHint') }}</p>
        <div v-for="order in orders?.data" :key="order.id" class="card flex items-center justify-between p-4">
          <div>
            <div class="font-medium">#{{ order.id.slice(0, 8) }}</div>
            <div class="text-sm text-gray-500">{{ order.guest_email || t('admin.accountGuest') }}</div>
            <div class="text-xs text-gray-400">{{ formatDate(order.created_at) }}</div>
          </div>
          <div class="text-right">
            <div class="font-semibold">${{ order.total }}</div>
            <div class="text-xs" :class="order.status === 'paid' ? 'text-green-600' : 'text-gray-500'">
              {{ statusLabels[order.status] || order.status }}
            </div>
          </div>
        </div>
        <p v-if="!orders?.data?.length" class="text-center text-gray-500">{{ t('admin.noOrders') }}</p>
      </div>

      <!-- Users -->
      <div v-if="tab === 'users'" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm"
            :class="!userStatusFilter ? 'bg-brand-50 text-brand-600' : 'bg-white/10 text-gray-500'"
            @click="userStatusFilter = ''"
          >
            {{ t('admin.userFilterAll') }}
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-1 text-sm"
            :class="userStatusFilter === 'photographers_pending' ? 'bg-amber-500/15 text-amber-700' : 'bg-white/10 text-gray-500'"
            @click="userStatusFilter = 'photographers_pending'"
          >
            {{ t('admin.userFilterPendingPhotographers') }}
          </button>
        </div>
        <p class="text-sm text-gray-500">{{ t('admin.usersHint') }}</p>
        <div v-for="user in users?.data" :key="user.id" class="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="font-medium">{{ user.name || user.email }}</div>
            <div class="text-sm text-gray-500">{{ user.email }}</div>
          </div>
          <div class="flex flex-wrap items-center gap-2 sm:justify-end">
            <div class="text-right sm:mr-2">
              <div class="text-sm font-medium">{{ roleLabels[user.role] || user.role }}</div>
              <div v-if="user.role === 'photographer'" class="space-y-0.5 text-xs">
                <div :class="user.status === 'pending' ? 'text-amber-600' : user.status === 'rejected' ? 'text-red-500' : 'text-green-600'">
                  {{ userStatusLabels[user.status] || user.status }}
                </div>
                <div :class="user.email_verified ? 'text-green-600' : 'text-amber-600'">
                  {{ user.email_verified ? t('admin.emailVerified') : t('admin.emailNotVerified') }}
                </div>
                <div v-if="user.stripe_status" :class="user.stripe_status === 'active' ? 'text-green-600' : 'text-gray-400'">
                  {{ t('admin.stripeLabel') }}: {{ stripeStatusLabels[user.stripe_status] || user.stripe_status }}
                </div>
              </div>
              <div v-else class="text-xs text-gray-400">{{ formatDate(user.created_at) }}</div>
            </div>
            <template v-if="user.role === 'photographer' && user.status === 'pending' && user.email_verified">
              <button type="button" class="btn-primary-solid px-3 py-1.5 text-sm" @click="setUserStatus(user.id, 'approved')">
                {{ t('admin.approvePhotographer') }}
              </button>
              <button type="button" class="btn-secondary px-3 py-1.5 text-sm" @click="setUserStatus(user.id, 'rejected')">
                {{ t('admin.rejectPhotographer') }}
              </button>
            </template>
            <button
              v-else-if="user.role === 'photographer' && user.status === 'rejected' && user.email_verified"
              type="button"
              class="btn-secondary px-3 py-1.5 text-sm"
              @click="setUserStatus(user.id, 'approved')"
            >
              {{ t('admin.approvePhotographer') }}
            </button>
          </div>
        </div>
        <p v-if="!users?.data?.length" class="text-center text-gray-500">{{ t('admin.noUsers') }}</p>
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
            <span class="text-gray-600">{{ t('admin.priceSingle') }}</span>
            <input v-model.number="editPriceSingle" type="number" min="1" step="0.01" class="input-field mt-1">
          </label>
          <label class="block text-sm">
            <span class="text-gray-600">{{ t('admin.priceBundle') }}</span>
            <input v-model.number="editPriceBundle" type="number" min="1" step="0.01" class="input-field mt-1">
          </label>
          <label class="block text-sm">
            <span class="text-gray-600">{{ t('admin.statusLabel') }}</span>
            <select v-model="editStatus" class="input-field mt-1">
              <option value="published">{{ t('admin.tournamentStatusPublished') }}</option>
              <option value="draft">{{ t('admin.statusHidden') }}</option>
            </select>
          </label>
          <div class="flex gap-2">
            <button class="btn-primary-solid flex-1" :disabled="tournamentSaving" @click="saveTournament">
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
