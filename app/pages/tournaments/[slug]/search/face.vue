<script setup lang="ts">
import type { Photo } from '~/types'

const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const selection = useSelectionStore()
const faceSearch = useFaceSearchStore()
const { t } = useI18n()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const searching = ref(false)
const errorMsg = ref('')
const restoredResults = faceSearch.getResults(slug)
const results = ref<Photo[] | null>(restoredResults.length ? restoredResults : null)

const { data: tournament } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))
const { data: platform } = await useAsyncData('platform-home-face', () => api.getPlatformHome())

const faceSearchEnabled = computed(() => platform.value?.face_search_enabled ?? true)

watchEffect(() => {
  if (tournament.value?.id) {
    selection.setContext(tournament.value.id)
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

function pickFile() {
  fileInput.value?.click()
}

async function search() {
  if (!faceSearchEnabled.value) {
    errorMsg.value = t('search.faceDisabled')
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
    const response = await api.searchByFace(slug, selectedFile.value)
    results.value = response.data
    faceSearch.setResults(slug, response.data)
    if (!response.data.length) {
      errorMsg.value = t('search.faceNotFound')
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string }; statusCode?: number }
    if (err.statusCode === 503 || err.data?.error === 'face search is disabled') {
      errorMsg.value = t('search.faceDisabled')
    }
    else {
      errorMsg.value = err.data?.error || t('search.searchFailed')
    }
  }
  finally {
    searching.value = false
  }
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
      <SearchStepper :current="results ? 3 : 2" />

      <TournamentCard v-if="tournament" :tournament="tournament" compact class="mb-5" />

      <div v-if="!faceSearchEnabled" class="mb-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-500/20">
        {{ t('search.faceDisabledHint') }}
      </div>

      <div class="card mb-4 p-5" :class="{ 'opacity-60': !faceSearchEnabled }">
        <p class="mb-4 text-sm text-gray-600">
          {{ t('search.faceHint') }}
        </p>

        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          class="hidden"
          :disabled="!faceSearchEnabled"
          @change="onFileChange"
        >

        <div v-if="previewUrl" class="mb-4 overflow-hidden rounded-xl bg-white/10">
          <img :src="previewUrl" :alt="t('search.previewAlt')" class="mx-auto max-h-64 w-full object-contain">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="btn-secondary" :disabled="!faceSearchEnabled" @click="pickFile">
            {{ previewUrl ? t('search.anotherPhoto') : t('search.choosePhoto') }}
          </button>
          <button
            type="button"
            class="btn-primary-solid"
            :disabled="!faceSearchEnabled || !selectedFile || searching"
            @click="search"
          >
            {{ searching ? t('search.searching') : t('search.findPhotos') }}
          </button>
        </div>
      </div>

      <p v-if="errorMsg" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {{ errorMsg }}
      </p>

      <div v-if="results?.length">
        <div class="mb-4 flex items-center justify-between text-sm">
          <span class="text-gray-400">{{ t('search.foundCount', { count: results.length }) }}</span>
          <NuxtLink :to="`/tournaments/${slug}`" class="font-medium text-brand-600">{{ t('search.changeMethod') }}</NuxtLink>
        </div>
        <PhotoGrid :photos="results" selectable />
      </div>
    </div>

    <div v-if="results?.length" class="floating-above-nav">
      <NuxtLink
        v-if="selection.count"
        :to="`/cart?tournament_id=${tournament?.id}`"
        class="btn-primary-solid block text-center"
      >
        {{ t('search.toCart', { count: selection.count, total: selection.total.toFixed(0) }) }}
      </NuxtLink>
    </div>
  </div>
</template>
