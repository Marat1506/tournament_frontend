<script setup lang="ts">
definePageMeta({ ssr: false })

import type { Photo } from '~/types'

const CONSENT_SESSION_KEY = 'bjj_consent_personal_checked'

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
  }
})

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  errorMsg.value = ''
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
      errorMsg.value = t('search.faceNotFound')
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string }; statusCode?: number }
    if (err.statusCode === 503 || err.data?.error === 'face search is disabled') {
      errorMsg.value = t('search.faceDisabled')
    }
    else if (err.data?.error === 'no face detected in image') {
      errorMsg.value = t('search.faceNotFound')
    }
    else if (err.data?.error === 'personal consent is required') {
      errorMsg.value = t('search.consentRequired')
    }
    else {
      errorMsg.value = err.data?.error || t('search.searchFailed')
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

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="page-with-floating-cta">
    <AppPageHeader :title="t('search.byFace')">
      <template #left>
        <NuxtLink :to="`/tournaments/${slug}`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <SearchStepper :current="results ? 3 : 2" tournament-to="/tournaments" />
      <SearchModeTabs :slug="slug" mode="face" />

      <h2 class="mb-2 text-xl font-bold">{{ t('search.findYourselfTitle') }}</h2>
      <p class="mb-4 text-sm text-gray-400">{{ t('search.findYourselfHint') }}</p>

      <TournamentCard v-if="tournament" :tournament="tournament" compact class="mb-3" />
      <div class="mb-5 flex justify-end">
        <NuxtLink :to="`/tournaments/${slug}`" class="inline-flex items-center gap-1 text-sm font-medium text-brand-400">
          <AppIcon name="pencil" class="h-3.5 w-3.5" />
          {{ t('search.changeTournament') }}
        </NuxtLink>
      </div>

      <div v-if="!faceSearchEnabled" class="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-500/20">
        {{ t('search.faceDisabledHint') }}
      </div>

      <div
        v-if="hasExistingConsent"
        class="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-200 ring-1 ring-green-500/20"
      >
        {{ t('search.consentAlreadyGiven') }}
      </div>

      <div v-else class="card mb-4 border-brand-500/30 p-5 ring-1 ring-brand-500/20">
        <div class="mb-3 flex items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
            <AppIcon name="face" class="h-5 w-5" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-100">{{ t('search.consentTitle') }}</h2>
            <p class="mt-1 text-sm text-gray-400">{{ t('search.consentIntro') }}</p>
          </div>
        </div>

        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <input
            v-model="consentPersonal"
            type="checkbox"
            class="input-check"
          >
          <span class="text-sm leading-relaxed text-gray-200">{{ t('search.consentCheckbox') }}</span>
        </label>

        <NuxtLink to="/privacy" class="mt-3 inline-block text-sm text-brand-500 hover:underline">
          {{ t('search.consentPrivacyLink') }}
        </NuxtLink>
      </div>

      <div class="card mb-4 p-5" :class="{ 'opacity-60': !faceSearchEnabled || !consentOk }">
        <div
          class="mb-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-500/50 bg-brand-600/5 px-4 py-8 text-center"
        >
          <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
            <AppIcon name="face" class="h-7 w-7" />
          </div>
          <div class="font-semibold">{{ t('search.uploadSelfie') }}</div>
          <p class="mt-1 max-w-xs text-xs text-gray-400">{{ t('search.uploadSelfieHint') }}</p>
          <button type="button" class="btn-primary-solid mt-4 max-w-xs" :disabled="!faceSearchEnabled || !consentOk" @click="pickFile">
            {{ previewUrl ? t('search.anotherPhoto') : t('search.choosePhoto') }}
          </button>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          :disabled="!faceSearchEnabled || !consentOk"
          @change="onFileChange"
        >
        <input
          ref="cameraInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          class="hidden"
          :disabled="!faceSearchEnabled || !consentOk"
          @change="onFileChange"
        >

        <div v-if="previewUrl" class="mb-4 overflow-hidden rounded-xl bg-white/10">
          <img :src="previewUrl" :alt="t('search.previewAlt')" class="mx-auto max-h-64 w-full object-contain">
        </div>

        <p class="mb-3 text-center text-xs uppercase tracking-wide text-gray-500">{{ t('search.or') }}</p>
        <button type="button" class="btn-secondary justify-center gap-2" :disabled="!faceSearchEnabled || !consentOk" @click="takePhoto">
          <AppIcon name="camera" class="h-5 w-5" />
          {{ t('search.takePhotoNow') }}
        </button>

        <button
          type="button"
          class="btn-primary-solid mt-3"
          :disabled="!canSearch"
          @click="search"
        >
          {{ searching ? t('search.searching') : t('search.findPhotos') }}
        </button>
      </div>

      <div class="cabinet-row mb-4">
        <div class="icon-tile">
          <AppIcon name="shield" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ t('search.privacyTitle') }}</div>
          <div class="text-sm text-gray-500">{{ t('search.privacyBody') }}</div>
        </div>
      </div>

      <p v-if="errorMsg" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMsg }}
      </p>

      <div v-if="showClaimBanner" class="card mb-4 space-y-3 border-brand-500/30 p-4 ring-1 ring-brand-500/20">
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

      <div v-if="results?.length">
        <div class="mb-4 flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ t('search.foundCount', { count: results.length }) }}</span>
          <NuxtLink :to="`/tournaments/${slug}`" class="font-medium text-brand-600">{{ t('search.changeMethod') }}</NuxtLink>
        </div>
        <div v-if="tournament && tournament.payouts_ready === false" class="mb-4">
          <AppAlert type="info" :message="t('cart.errorPayouts')" />
        </div>
        <PhotoGrid
          :photos="results"
          selectable
          :purchases-enabled="tournament?.payouts_ready !== false"
          from-face-search
        />
      </div>
    </div>

    <div v-if="results?.length" class="floating-above-nav">
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
          class="rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white"
          :class="{ 'pointer-events-none opacity-40': !selection.count }"
        >
          {{ t('search.toCart') }} ›
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
