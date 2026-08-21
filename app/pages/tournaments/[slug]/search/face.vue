<script setup lang="ts">
definePageMeta({ ssr: false })

import type { Photo } from '~/types'

const CONSENT_SESSION_KEY = 'bjj_consent_personal_checked'
const MAX_SELFIE_SIZE = 5 * 1024 * 1024
const ALLOWED_SELFIE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const auth = useAuthStore()
const selection = useSelectionStore()
const faceSearch = useFaceSearchStore()
const toast = useToast()
const { t } = useI18n()

const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const consentPersonal = ref(false)
const hasExistingConsent = ref(false)
const claimedAthleteIds = ref<Set<string>>(new Set())
const searching = ref(false)
const errorMsg = ref('')
const claimDismissed = ref(false)
const claimDone = ref(false)
const claiming = ref(false)
const restoredResults = faceSearch.getResults(slug)
const results = ref<Photo[] | null>(restoredResults.length ? restoredResults : null)

const isClient = computed(() => auth.isLoggedIn && auth.user?.role === 'client')

const needsClaim = computed(() => {
  if (!results.value?.length) return false
  return results.value.some(p => p.athlete_id && !claimedAthleteIds.value.has(p.athlete_id))
})

const showClaimBanner = computed(() =>
  isClient.value
  && !!results.value?.length
  && needsClaim.value
  && !claimDismissed.value
  && !claimDone.value,
)

const { data: tournament } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug), { server: false })
const { data: platform } = await useAsyncData('platform-home-face', () => api.getPlatformHome(), { server: false })

watch(consentPersonal, (v) => {
  if (!import.meta.client) return
  if (v) sessionStorage.setItem(CONSENT_SESSION_KEY, '1')
  else sessionStorage.removeItem(CONSENT_SESSION_KEY)
})
if (import.meta.client && sessionStorage.getItem(CONSENT_SESSION_KEY) === '1') {
  consentPersonal.value = true
}

const { data: consentSummary } = await useAsyncData(
  () => `face-consent-${slug}-${tournament.value?.id || 'none'}`,
  () => {
    if (!auth.isLoggedIn || auth.user?.role !== 'client' || !tournament.value?.id) {
      return Promise.resolve(null)
    }
    return api.getConsentSummary(tournament.value.id)
  },
  { watch: [() => tournament.value?.id, () => auth.isLoggedIn], server: false },
)
watch(consentSummary, (s) => {
  if (s?.has_consent_for_tournament) {
    hasExistingConsent.value = true
    consentPersonal.value = true
  }
  if (s?.claimed_athlete_ids?.length) {
    claimedAthleteIds.value = new Set(s.claimed_athlete_ids)
  }
}, { immediate: true })

const faceSearchEnabled = computed(() => platform.value?.face_search_enabled ?? true)
const consentOk = computed(() => consentPersonal.value || hasExistingConsent.value)
const canSearch = computed(() => faceSearchEnabled.value && consentOk.value && !!selectedFile.value && !searching.value)

watchEffect(() => {
  if (tournament.value?.id) {
    selection.setContext(tournament.value.id, tournament.value.payouts_ready !== false)
    selection.setReturnPath(`/tournaments/${slug}/search/face`)
  }
})

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  errorMsg.value = ''
  if (!ALLOWED_SELFIE_TYPES.has(file.type)) {
    errorMsg.value = t('search.unsupportedSelfie')
    input.value = ''
    return
  }
  if (file.size > MAX_SELFIE_SIZE) {
    errorMsg.value = t('search.selfieTooLarge', { max: 5 })
    input.value = ''
    return
  }
  results.value = null
  faceSearch.clear()
  selectedFile.value = file

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
}

function requireConsentForPick() {
  if (!consentOk.value) {
    errorMsg.value = t('search.consentRequired')
    return false
  }
  return true
}

function pickFile() {
  if (!requireConsentForPick()) return
  fileInput.value?.click()
}

function takePhoto() {
  if (!requireConsentForPick()) return
  cameraInput.value?.click()
}

async function search() {
  if (!faceSearchEnabled.value) {
    errorMsg.value = t('search.faceDisabled')
    return
  }
  if (!consentOk.value) {
    errorMsg.value = t('search.consentRequired')
    return
  }
  if (!selectedFile.value) {
    errorMsg.value = t('search.pickSelfie')
    return
  }

  searching.value = true
  errorMsg.value = ''
  results.value = null

  try {
    const response = await api.searchByFace(
      slug,
      selectedFile.value,
      true,
      faceSearch.getGuestToken() || undefined,
    )
    const data = response.data ?? []
    results.value = data
    faceSearch.setResults(slug, data, response.guest_consent_token)
    if (!data.length) {
      errorMsg.value = t('search.noFaceMatches')
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string }; statusCode?: number }
    if (err.statusCode === 503 || err.data?.error === 'face search is disabled') {
      errorMsg.value = t('search.faceDisabled')
    }
    else if (err.data?.error === 'no face detected in image') {
      errorMsg.value = t('search.noFaceInImage')
    }
    else if (err.data?.error === 'personal consent is required') {
      errorMsg.value = t('search.consentRequired')
    }
    else {
      errorMsg.value = t(getCommonApiErrorKey(e) ?? 'search.searchFailed')
    }
  }
  finally {
    searching.value = false
  }
}

async function confirmClaim() {
  if (!results.value?.length) return
  claiming.value = true
  try {
    const { claimed } = await api.claimFromFace(results.value.map(p => p.id))
    claimDone.value = true
    for (const photo of results.value) {
      if (photo.athlete_id) {
        claimedAthleteIds.value.add(photo.athlete_id)
      }
    }
    toast.success(t('search.claimSuccess', { count: claimed }))
  }
  catch {
    toast.error(t('search.claimFailed'))
  }
  finally {
    claiming.value = false
  }
}

function dismissClaim() {
  claimDismissed.value = true
}

function editSearch() {
  results.value = null
  errorMsg.value = ''
}

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="page-with-floating-cta">
    <AppPageHeader :title="t('tournaments.findMyPhotos')">
      <template #left>
        <NuxtLink to="/tournaments" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <SearchStepper :current="results?.length ? 3 : 2" tournament-to="/tournaments" />
      <SearchModeTabs :slug="slug" mode="face" />

      <h1 class="text-2xl font-bold tracking-tight">{{ t('search.findYourselfTitle') }}</h1>
      <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ t('search.findYourselfHint') }}</p>

      <AppAlert v-if="!faceSearchEnabled" class="mt-4" type="info" :message="t('search.faceDisabledHint')" />

      <div v-if="!results?.length" class="card mt-5 p-4">
        <div
          class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-500/60 bg-brand-600/5 px-4 py-7 text-center"
        >
          <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600/20 text-brand-400">
            <AppIcon name="face" class="h-6 w-6" />
          </div>
          <h2 class="font-semibold">{{ t('search.uploadSelfie') }}</h2>
          <p class="mt-1 max-w-xs text-sm leading-relaxed text-gray-400">{{ t('search.uploadSelfieHint') }}</p>

          <div v-if="previewUrl" class="mt-4 w-full overflow-hidden rounded-xl bg-white/10">
            <img :src="previewUrl" :alt="t('search.previewAlt')" class="mx-auto max-h-60 w-full object-contain">
          </div>

          <button
            type="button"
            class="btn-primary-solid mt-5 w-auto min-w-52 px-8"
            :disabled="!faceSearchEnabled || !consentOk || searching"
            @click="pickFile"
          >
            {{ previewUrl ? t('search.anotherPhoto') : t('search.chooseFromGallery') }}
          </button>

          <div class="my-3 flex w-full items-center gap-3 text-xs uppercase tracking-wide text-gray-500">
            <span class="h-px flex-1 bg-white/10" />
            {{ t('search.or') }}
            <span class="h-px flex-1 bg-white/10" />
          </div>
          <button
            type="button"
            class="btn-secondary justify-center"
            :disabled="!faceSearchEnabled || !consentOk || searching"
            @click="takePhoto"
          >
            <AppIcon name="camera" class="h-5 w-5" />
            {{ t('search.takeSelfie') }}
          </button>
        </div>

        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFileChange">
        <input ref="cameraInput" type="file" accept="image/jpeg,image/png,image/webp" capture="user" class="hidden" @change="onFileChange">

        <label
          v-if="!hasExistingConsent"
          class="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10"
        >
          <input v-model="consentPersonal" type="checkbox" class="input-check">
          <span class="text-sm leading-relaxed text-gray-300">
            {{ t('search.consentCheckbox') }}
            <NuxtLink to="/privacy" class="font-medium text-brand-400">{{ t('search.consentPrivacyLink') }}</NuxtLink>
          </span>
        </label>

        <p v-if="!consentOk" class="mt-3 text-sm text-amber-300">{{ t('search.consentBeforePhoto') }}</p>
        <button
          v-if="selectedFile"
          type="button"
          class="btn-primary-solid mt-4"
          :disabled="!canSearch"
          @click="search"
        >
          <span v-if="searching" class="loading-spinner" aria-hidden="true" />
          {{ searching ? t('search.searching') : t('search.findPhotos') }}
        </button>
        <AppAlert v-if="errorMsg" class="mt-4" type="error" :message="errorMsg" />
      </div>

      <div v-else class="card mt-5 flex items-center gap-3 p-3">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/15 text-green-300">
          <AppIcon name="check" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ t('search.searchComplete') }}</div>
          <div class="text-sm text-gray-500">{{ t('search.foundCount', { count: results.length }) }}</div>
        </div>
        <button type="button" class="btn-outline shrink-0" @click="editSearch">{{ t('search.changeSelfie') }}</button>
      </div>

      <div class="mt-4 flex items-center gap-3 rounded-xl bg-surface p-3 ring-1 ring-white/[0.06]">
        <div class="icon-tile">
          <AppIcon name="shield" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ t('search.privacyTitle') }}</div>
          <div class="text-sm text-gray-500">{{ t('search.privacyBody') }}</div>
        </div>
      </div>

      <SelectedTournamentCard v-if="tournament" class="mt-4" :tournament="tournament" change-to="/tournaments" />

      <div v-if="tournament && tournament.payouts_ready === false" class="mt-4">
        <AppAlert type="info" :message="t('cart.errorPayouts')" />
      </div>

      <div v-if="showClaimBanner" class="card mt-4 space-y-3 border-brand-500/30 p-4 ring-1 ring-brand-500/20">
        <p class="text-sm text-gray-200">
          {{ t('search.claimPrompt', { count: results?.length ?? 0 }) }}
        </p>
        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="btn-primary-solid" :disabled="claiming" @click="confirmClaim">
            {{ claiming ? t('search.claiming') : t('search.claimYes') }}
          </button>
          <button type="button" class="btn-secondary" :disabled="claiming" @click="dismissClaim">
            {{ t('search.claimNo') }}
          </button>
        </div>
      </div>

      <div v-if="results?.length" class="mt-5">
        <PhotoGrid
          :photos="results"
          selectable
          :purchases-enabled="tournament?.payouts_ready !== false"
          from-face-search
        />
      </div>
    </div>

    <div v-if="results?.length && selection.count" class="floating-above-nav">
      <div class="card flex items-center gap-3 p-3 shadow-lg">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
          <AppIcon name="cart" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold">{{ t('search.selectedCount', { count: selection.count }) }}</div>
          <div class="text-xs text-gray-400">${{ selection.total.toFixed(2) }}</div>
        </div>
        <NuxtLink
          :to="`/cart?tournament_id=${tournament?.id}`"
          class="min-h-11 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white"
          :class="{ 'pointer-events-none opacity-40': !selection.count }"
        >
          {{ t('search.toCart') }} ›
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
