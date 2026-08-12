<script setup lang="ts">
import type { UploadBatch } from '~/types'

definePageMeta({ middleware: 'photographer-auth' })

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const api = useApi()
const toast = useToast()
const id = route.params.id as string

const { data: tournaments, refresh: refreshList, error: loadError } = await useAsyncData('my-tournaments-detail', () => api.getMyTournaments())
const tournament = computed(() => tournaments.value?.data?.find(item => item.id === id))

const isPublished = computed(() => tournament.value?.status === 'published')

const statusLabel = computed(() => {
  const status = tournament.value?.status
  if (status === 'published') return t('photographer.statusPublished')
  if (status === 'draft') return t('photographer.statusDraft')
  return status || ''
})

const files = ref<File[]>([])
const uploading = ref(false)
const publishing = ref(false)
const batch = ref<UploadBatch | null>(null)
const uploadAlert = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const publishAlert = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const coverAlert = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const uploadInput = ref<HTMLInputElement | null>(null)
const coverUploading = ref(false)

let pollTimer: ReturnType<typeof setInterval> | undefined

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

function finishBatch(status: UploadBatch) {
  stopPolling()
  uploading.value = false

  if (status.status === 'failed') {
    uploadAlert.value = { type: 'error', message: t('photographer.msgUploadFailed') }
    toast.error(t('photographer.msgUploadFailed'))
    return
  }

  if (status.failed_files > 0) {
    uploadAlert.value = {
      type: 'error',
      message: t('photographer.msgPartialFailure', { failed: status.failed_files, total: status.total_files }),
    }
    toast.error(t('photographer.msgPartialFailure', { failed: status.failed_files, total: status.total_files }))
    return
  }

  uploadAlert.value = { type: 'success', message: t('photographer.msgProcessed') }
  toast.success(t('photographer.msgProcessed'))
}

async function pollUploadStatus() {
  try {
    batch.value = await api.getUploadStatus(id)
    await refreshList()
    if (batch.value.status !== 'in_progress') {
      finishBatch(batch.value)
    }
  } catch {
    stopPolling()
    uploading.value = false
    uploadAlert.value = { type: 'error', message: t('photographer.msgStatusFailed') }
    toast.error(t('photographer.msgStatusFailed'))
  }
}

async function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  files.value = Array.from(input.files)
  uploadAlert.value = null
}

async function upload() {
  if (!files.value.length) return
  stopPolling()
  uploading.value = true
  uploadAlert.value = null
  try {
    batch.value = await api.uploadPhotos(id, files.value)
    files.value = []
    if (uploadInput.value) uploadInput.value.value = ''
    pollTimer = setInterval(pollUploadStatus, 2000)
    await pollUploadStatus()
  } catch (e: unknown) {
    uploading.value = false
    const key = mapApiError(e, [
      { match: 'tournament not found', key: 'photographer.errNotFound' },
      { match: 'unsupported', key: 'photographer.errUnsupportedImage' },
    ], 'photographer.msgUploadError')
    uploadAlert.value = { type: 'error', message: t(key) }
    toast.error(t(key))
  }
}

async function publish() {
  if (isPublished.value || publishing.value) return
  publishing.value = true
  publishAlert.value = null
  try {
    await api.publishTournament(id)
    await refreshList()
    publishAlert.value = { type: 'success', message: t('photographer.msgPublishedDetail') }
    toast.success(t('photographer.msgPublished'))
  } catch (e: unknown) {
    const key = mapApiError(e, [
      { match: 'upload photos first', key: 'photographer.msgUploadFirst' },
      { match: 'already published', key: 'photographer.msgAlreadyPublished' },
      { match: 'tournament not found', key: 'photographer.errNotFound' },
    ], 'photographer.msgPublishFailed')
    publishAlert.value = { type: 'error', message: t(key) }
    toast.error(t(key))
  } finally {
    publishing.value = false
  }
}

async function onCoverSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  coverUploading.value = true
  coverAlert.value = null
  try {
    await api.uploadTournamentCover(id, file)
    await refreshList()
    coverAlert.value = { type: 'success', message: t('photographer.msgCoverUpdated') }
    toast.success(t('photographer.msgCoverUpdated'))
  } catch (e: unknown) {
    const key = mapApiError(e, [
      { match: 'unsupported', key: 'photographer.errUnsupportedImage' },
    ], 'photographer.msgCoverFailed')
    coverAlert.value = { type: 'error', message: t(key) }
    toast.error(t(key))
  } finally {
    coverUploading.value = false
    input.value = ''
  }
}

const qrBlobUrl = ref('')
const qrError = ref(false)

watchEffect(async () => {
  if (!isPublished.value || !import.meta.client) {
    qrBlobUrl.value = ''
    qrError.value = false
    return
  }
  qrError.value = false
  try {
    const blob = await $fetch<Blob>(api.qrUrl(id), {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      responseType: 'blob',
    })
    if (qrBlobUrl.value) URL.revokeObjectURL(qrBlobUrl.value)
    qrBlobUrl.value = URL.createObjectURL(blob)
  } catch {
    if (qrBlobUrl.value) URL.revokeObjectURL(qrBlobUrl.value)
    qrBlobUrl.value = ''
    qrError.value = true
  }
})

onUnmounted(() => {
  stopPolling()
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

    <div v-if="loadError" class="page-container">
      <AppAlert type="error" :message="t('photographer.loadDetailFailed')" />
      <button class="btn-primary-solid mt-4" @click="refreshList()">{{ t('common.retry') }}</button>
    </div>

    <div v-else-if="!tournament" class="page-container">
      <AppAlert type="error" :message="t('photographer.errNotFound')" />
      <NuxtLink to="/photographer/dashboard" class="btn-primary-solid mt-4 block text-center">
        {{ t('photographer.backToDashboard') }}
      </NuxtLink>
    </div>

    <div v-else class="page-container space-y-5">
      <AppAlert
        v-if="isPublished"
        type="success"
        :message="t('photographer.publishedBanner')"
      />

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
        <div v-if="coverAlert" class="px-4 pb-4">
          <AppAlert :type="coverAlert.type" :message="coverAlert.message" />
        </div>
      </section>

      <div class="card p-4">
        <div class="text-sm text-gray-500">{{ t('photographer.slugLabel') }}</div>
        <div class="font-mono text-sm">/t/{{ tournament.slug }}</div>
        <div class="mt-2 text-sm">
          {{ t('photographer.statusLabel') }}:
          <strong :class="isPublished ? 'text-green-400' : ''">{{ statusLabel }}</strong>
          · {{ tournament.photo_count }} {{ t('common.photos') }}
        </div>
      </div>

      <section class="card space-y-3 p-4">
        <h2 class="font-semibold">{{ t('photographer.uploadSection') }}</h2>
        <input ref="uploadInput" type="file" multiple accept="image/jpeg,image/png,image/webp,image/*" class="block w-full text-sm" @change="onFilesSelected">
        <button class="btn-primary-solid w-full" :disabled="uploading || !files.length" @click="upload">
          {{ uploading ? t('photographer.uploading') : t('photographer.uploadBtn', { count: files.length }) }}
        </button>
        <div v-if="batch" class="text-sm text-gray-400">
          {{ t('photographer.processed', { done: batch.processed_files, total: batch.total_files }) }}
        </div>
        <AppAlert v-if="uploadAlert" :type="uploadAlert.type" :message="uploadAlert.message" />
      </section>

      <section class="card space-y-3 p-4">
        <h2 class="font-semibold">{{ t('photographer.publishSection') }}</h2>
        <p v-if="!isPublished" class="text-sm text-gray-400">{{ t('photographer.publishHint') }}</p>
        <button
          class="btn-primary-solid w-full"
          :disabled="isPublished || publishing"
          @click="publish"
        >
          {{
            isPublished
              ? t('photographer.alreadyPublishedBtn')
              : (publishing ? t('photographer.publishing') : t('photographer.publish'))
          }}
        </button>
        <AppAlert v-if="publishAlert" :type="publishAlert.type" :message="publishAlert.message" />
      </section>

      <section class="card p-4">
        <NuxtLink :to="`/photographer/tournaments/${id}/settings`" class="font-medium text-brand-600">
          {{ t('photographer.settingsLink') }}
        </NuxtLink>
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

      <section v-if="isPublished" class="card p-4 text-center">
        <h2 class="mb-3 font-semibold">{{ t('photographer.qrTitle') }}</h2>
        <img v-if="qrBlobUrl" :src="qrBlobUrl" :alt="t('photographer.qrAlt')" class="mx-auto h-48 w-48">
        <AppAlert v-else-if="qrError" type="error" :message="t('photographer.qrFailed')" />
        <p class="mt-2 text-xs text-gray-500">{{ t('photographer.qrHint') }}</p>
      </section>
    </div>
  </div>
</template>
