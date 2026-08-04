<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const api = useApi()
const id = route.params.id as string

if (!auth.isLoggedIn) {
  await navigateTo('/photographer/login')
}

const { data: tournaments, refresh: refreshList } = await useAsyncData('my-tournaments-detail', () => api.getMyTournaments())
const tournament = computed(() => tournaments.value?.data?.find(t => t.id === id))

const files = ref<File[]>([])
const uploading = ref(false)
const batch = ref<{ processed_files: number; total_files: number; status: string } | null>(null)
const message = ref('')
const coverInput = ref<HTMLInputElement | null>(null)
const coverUploading = ref(false)

let pollTimer: ReturnType<typeof setInterval>

async function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  files.value = Array.from(input.files)
}

async function upload() {
  if (!files.value.length) return
  uploading.value = true
  message.value = ''
  try {
    batch.value = await api.uploadPhotos(id, files.value)
    files.value = []
    pollTimer = setInterval(async () => {
      try {
        batch.value = await api.getUploadStatus(id)
        await refreshList()
        if (batch.value.status !== 'in_progress') {
          clearInterval(pollTimer)
          uploading.value = false
          message.value = t('photographer.msgProcessed')
        }
      } catch {
        clearInterval(pollTimer)
        uploading.value = false
      }
    }, 2000)
  } catch {
    message.value = t('photographer.msgUploadError')
    uploading.value = false
  }
}

async function publish() {
  try {
    await api.publishTournament(id)
    await refreshList()
    message.value = t('photographer.msgPublished')
  } catch {
    message.value = t('photographer.msgUploadFirst')
  }
}

async function onCoverSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  coverUploading.value = true
  message.value = ''
  try {
    await api.uploadTournamentCover(id, file)
    await refreshList()
    message.value = t('photographer.msgCoverUpdated')
  } catch {
    message.value = t('photographer.msgCoverFailed')
  } finally {
    coverUploading.value = false
    input.value = ''
  }
}

const qrBlobUrl = ref('')

watchEffect(async () => {
  if (tournament.value?.status !== 'published' || !import.meta.client) return
  try {
    const blob = await $fetch<Blob>(api.qrUrl(id), {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      responseType: 'blob',
    })
    qrBlobUrl.value = URL.createObjectURL(blob)
  } catch {
    qrBlobUrl.value = ''
  }
})

onUnmounted(() => {
  clearInterval(pollTimer)
  if (qrBlobUrl.value) URL.revokeObjectURL(qrBlobUrl.value)
})
</script>

<template>
  <div>
    <AppPageHeader :title="tournament?.name || t('photographer.tournamentFallback')">
      <template #left>
        <NuxtLink to="/photographer/dashboard" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div v-if="tournament" class="page-container space-y-5">
      <section class="card overflow-hidden p-0">
        <div class="flex gap-4 p-4">
          <button
            type="button"
            class="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10"
            :disabled="coverUploading"
            @click="coverInput?.click()"
          >
            <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
          </button>
          <div class="min-w-0 flex-1">
            <h2 class="font-semibold leading-snug">{{ tournament.name }}</h2>
            <p v-if="tournament.location" class="mt-1 text-sm text-gray-500">{{ tournament.location }}</p>
            <button
              type="button"
              class="mt-2 text-sm font-medium text-brand-600"
              :disabled="coverUploading"
              @click="coverInput?.click()"
            >
              {{ coverUploading ? t('photographer.uploading') : (tournament.cover_image ? t('photographer.changeCover') : t('photographer.addCover')) }}
            </button>
          </div>
        </div>
        <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onCoverSelected">
      </section>

      <div class="card p-4">
        <div class="text-sm text-gray-500">{{ t('photographer.slugLabel') }}</div>
        <div class="font-mono text-sm">/t/{{ tournament.slug }}</div>
        <div class="mt-2 text-sm">{{ t('photographer.statusLabel') }}: <strong>{{ tournament.status }}</strong> · {{ tournament.photo_count }} {{ t('common.photos') }}</div>
      </div>

      <section class="card p-4 space-y-3">
        <h2 class="font-semibold">{{ t('photographer.uploadSection') }}</h2>
        <input type="file" multiple accept="image/*" class="block w-full text-sm" @change="onFilesSelected">
        <button class="btn-primary-solid w-full" :disabled="uploading || !files.length" @click="upload">
          {{ uploading ? t('photographer.uploading') : t('photographer.uploadBtn', { count: files.length }) }}
        </button>
        <div v-if="batch" class="text-sm text-gray-600">
          {{ t('photographer.processed', { done: batch.processed_files, total: batch.total_files }) }}
        </div>
      </section>

      <section class="card p-4 space-y-3">
        <h2 class="font-semibold">{{ t('photographer.publishSection') }}</h2>
        <button class="btn-primary-solid w-full" :disabled="tournament.status === 'published'" @click="publish">
          {{ t('photographer.publish') }}
        </button>
      </section>

      <section class="card p-4">
        <NuxtLink :to="`/photographer/tournaments/${id}/photos`" class="font-medium text-brand-600">
          {{ t('photographer.tagPhotosLink') }}
        </NuxtLink>
      </section>

      <section class="card p-4">
        <NuxtLink :to="`/photographer/tournaments/${id}/stats`" class="font-medium text-brand-600">
          {{ t('photographer.statsLink') }}
        </NuxtLink>
      </section>

      <section v-if="tournament.status === 'published'" class="card p-4 text-center">
        <h2 class="mb-3 font-semibold">{{ t('photographer.qrTitle') }}</h2>
        <img v-if="qrBlobUrl" :src="qrBlobUrl" alt="QR code" class="mx-auto h-48 w-48">
        <p class="mt-2 text-xs text-gray-500">{{ t('photographer.qrHint') }}</p>
      </section>

      <p v-if="message" class="text-center text-sm font-medium text-brand-600">{{ message }}</p>
    </div>
  </div>
</template>
