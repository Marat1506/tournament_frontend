<script setup lang="ts">
import type { Photo } from '~/types'

const route = useRoute()
const slug = route.params.slug as string
const api = useApi()
const selection = useSelectionStore()
const { t } = useI18n()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const searching = ref(false)
const errorMsg = ref('')
const results = ref<Photo[] | null>(null)

const { data: tournament } = await useAsyncData(`tournament-${slug}`, () => api.getTournament(slug))

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
    if (!response.data.length) {
      errorMsg.value = t('search.faceNotFound')
    }
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string } }
    errorMsg.value = err.data?.error || t('search.searchFailed')
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
  <div class="pb-32">
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

      <div class="card mb-4 p-5">
        <p class="mb-4 text-sm text-gray-600">
          {{ t('search.faceHint') }}
        </p>

        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          class="hidden"
          @change="onFileChange"
        >

        <div v-if="previewUrl" class="mb-4 overflow-hidden rounded-xl bg-white/10">
          <img :src="previewUrl" alt="Preview" class="mx-auto max-h-64 w-full object-contain">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button type="button" class="btn-secondary" @click="pickFile">
            {{ previewUrl ? t('search.anotherPhoto') : t('search.choosePhoto') }}
          </button>
          <button
            type="button"
            class="btn-primary-solid"
            :disabled="!selectedFile || searching"
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

    <div v-if="results?.length" class="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom))] z-40 px-4">
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
