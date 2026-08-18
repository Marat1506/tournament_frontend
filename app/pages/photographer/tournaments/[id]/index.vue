<script setup lang="ts">
import type { UploadBatch } from '~/types'

definePageMeta({ middleware: 'photographer-auth', ssr: false })

const { t } = useI18n()
const route = useRoute()
const api = useApi()
const toast = useToast()
const id = route.params.id as string

const { data: tournaments, refresh: refreshList, error: loadError } = await useAsyncData('my-tournaments-detail', () => api.getMyTournaments(), { server: false })
const { data: payouts } = await useAsyncData('photographer-payouts-banner', () => api.getPayouts(), { server: false })
const tournament = computed(() => tournaments.value?.data?.find(item => item.id === id))
const payoutsReady = computed(() => !payouts.value?.stripe_configured || !!payouts.value?.can_receive_payments)

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
const sendPercent = ref(0)
const uploadPhase = ref<'idle' | 'sending' | 'processing'>('idle')
const uploadAlert = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const publishAlert = ref<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
const coverAlert = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const uploadInput = ref<HTMLInputElement | null>(null)
const coverUploading = ref(false)

const agreementShoot = ref(false)
const agreementDistribute = ref(false)
const agreementAgreed = ref(false)
const agreementSaving = ref(false)
const agreementError = ref('')
const flowStep = ref(1)

const { data: agreementStatus } = await useAsyncData(
  'photographer-agreement',
  () => api.getPhotographerAgreementStatus(),
  { server: false },
)
watch(agreementStatus, (s) => {
  if (s?.agreed) agreementAgreed.value = true
}, { immediate: true })

watch(agreementAgreed, (v) => {
  if (v && flowStep.value < 2) {
    flowStep.value = (tournament.value?.photo_count ?? 0) > 0 ? 4 : 2
  }
}, { immediate: true })

const canUpload = computed(() => agreementAgreed.value)
const uploadInProgress = computed(() => uploading.value || batch.value?.status === 'in_progress' || uploadPhase.value !== 'idle')
const barPercent = computed(() => {
  if (uploadPhase.value === 'sending') {
    return Math.min(100, Math.max(2, sendPercent.value))
  }
  if (uploadPhase.value === 'processing') {
    const total = batch.value?.total_files ?? 0
    const done = (batch.value?.processed_files ?? 0) + (batch.value?.failed_files ?? 0)
    if (total <= 0) return 8
    const pct = Math.round((done / total) * 100)
    if (batch.value?.status === 'in_progress') {
      return Math.min(99, Math.max(8, pct))
    }
    return Math.min(100, pct)
  }
  return 0
})
const progressLabel = computed(() => {
  if (uploadPhase.value === 'sending') {
    return t('photographer.sendingFiles', { percent: sendPercent.value })
  }
  if (uploadPhase.value === 'processing') {
    return t('photographer.uploadProgress', {
      done: (batch.value?.processed_files ?? 0) + (batch.value?.failed_files ?? 0),
      total: batch.value?.total_files ?? files.value.length,
    })
  }
  return ''
})
const canPublish = computed(() =>
  !isPublished.value
  && !publishing.value
  && !uploadInProgress.value
  && (tournament.value?.photo_count ?? 0) > 0,
)

const flowSteps = computed(() => [
  t('photographer.flowRules'),
  t('photographer.flowFiles'),
  t('photographer.flowUpload'),
  t('photographer.flowPublish'),
])

function canOpenStep(n: number) {
  if (n === 1) return !agreementAgreed.value || flowStep.value === 1
  if (!agreementAgreed.value) return false
  if (n === 2) return true
  if (n === 3) return files.value.length > 0 || !!batch.value || uploadInProgress.value || (tournament.value?.photo_count ?? 0) > 0
  return (tournament.value?.photo_count ?? 0) > 0
}

function goToStep(n: number) {
  if (!canOpenStep(n)) return
  flowStep.value = n
}

async function submitAgreement() {
  if (!agreementShoot.value || !agreementDistribute.value) {
    agreementError.value = t('photographer.agreementRequired')
    toast.error(t('photographer.agreementRequired'))
    return
  }
  agreementSaving.value = true
  agreementError.value = ''
  try {
    await api.recordPhotographerAgreement(agreementShoot.value, agreementDistribute.value)
    agreementAgreed.value = true
    flowStep.value = 2
    toast.success(t('photographer.saved'))
  } catch {
    agreementError.value = t('photographer.saveFailed')
    toast.error(t('photographer.saveFailed'))
  } finally {
    agreementSaving.value = false
  }
}

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
  uploadPhase.value = 'idle'

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
  flowStep.value = 4
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
    uploadPhase.value = 'idle'
    uploadAlert.value = { type: 'error', message: t('photographer.msgStatusFailed') }
    toast.error(t('photographer.msgStatusFailed'))
  }
}

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function addFiles(list: File[]) {
  const existing = new Set(files.value.map(fileKey))
  const next = [...files.value]
  for (const file of list) {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      continue
    }
    const key = fileKey(file)
    if (!existing.has(key)) {
      existing.add(key)
      next.push(file)
    }
  }
  files.value = next
  batch.value = null
  sendPercent.value = 0
  uploadPhase.value = 'idle'
  uploadAlert.value = null
}

function removeFile(index: number) {
  files.value = files.value.filter((_, i) => i !== index)
}

function openPicker() {
  uploadInput.value?.click()
}

async function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  addFiles(Array.from(input.files))
  input.value = ''
}

async function upload() {
  if (!files.value.length || !canUpload.value) return
  stopPolling()
  uploading.value = true
  uploadAlert.value = null
  batch.value = null
  sendPercent.value = 0
  uploadPhase.value = 'sending'
  flowStep.value = 3
  try {
    batch.value = await api.uploadPhotos(id, files.value, (loaded, total) => {
      sendPercent.value = total > 0 ? Math.round((loaded / total) * 100) : 0
    })
    sendPercent.value = 100
    uploadPhase.value = 'processing'
    files.value = []
    if (uploadInput.value) uploadInput.value.value = ''
    pollTimer = setInterval(pollUploadStatus, 1000)
    await pollUploadStatus()
  } catch (e: unknown) {
    uploading.value = false
    uploadPhase.value = 'idle'
    const status = getApiErrorStatus(e)
    const raw = (e instanceof Error ? e.message : '') + ' ' + (getApiErrorMessage(e) || '')
    let key = mapApiError(e, [
      { match: 'tournament not found', key: 'photographer.errNotFound' },
      { match: 'unsupported', key: 'photographer.errUnsupportedImage' },
      { match: 'payload too large', key: 'photographer.errTooLarge' },
      { match: 'upload timeout', key: 'photographer.errUploadTimeout' },
    ], 'photographer.msgUploadError')
    if (status === 413) key = 'photographer.errTooLarge'
    else if (status === 408 || raw.includes('timeout')) key = 'photographer.errUploadTimeout'
    else if (status === 0) key = 'photographer.errUploadNetwork'
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
    const blob = await api.getQr(id)
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

      <p class="text-sm text-gray-400">{{ t('photographer.flowStepOf', { current: flowStep, total: 4 }) }}</p>
      <div class="flex items-start px-1">
        <template v-for="(label, index) in flowSteps" :key="label">
          <button
            type="button"
            class="flex w-16 flex-col items-center gap-2"
            :disabled="!canOpenStep(index + 1)"
            @click="goToStep(index + 1)"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              :class="index + 1 <= flowStep ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-500'"
            >
              {{ index + 1 }}
            </div>
            <span
              class="text-center text-[11px] font-medium leading-tight"
              :class="index + 1 <= flowStep ? 'text-brand-600' : 'text-gray-400'"
            >
              {{ label }}
            </span>
          </button>
          <div
            v-if="index < flowSteps.length - 1"
            class="mx-1 mt-4 h-0.5 flex-1 rounded-full"
            :class="index + 1 < flowStep ? 'bg-brand-600' : 'bg-white/10'"
          />
        </template>
      </div>

      <section v-if="flowStep === 1" class="card space-y-4 border-amber-500/30 p-5 ring-1 ring-amber-500/20">
        <h2 class="font-semibold">{{ t('photographer.agreementTitle') }}</h2>
        <p class="text-sm text-gray-400">{{ t('photographer.agreementIntro') }}</p>
        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3">
          <input v-model="agreementShoot" type="checkbox" class="mt-1 h-5 w-5 rounded border-gray-500">
          <span class="text-sm">{{ t('photographer.agreementShoot') }}</span>
        </label>
        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3">
          <input v-model="agreementDistribute" type="checkbox" class="mt-1 h-5 w-5 rounded border-gray-500">
          <span class="text-sm">{{ t('photographer.agreementDistribute') }}</span>
        </label>
        <NuxtLink to="/terms" class="text-sm text-brand-500 hover:underline">{{ t('photographer.agreementTermsLink') }}</NuxtLink>
        <AppAlert v-if="agreementError" type="error" :message="agreementError" />
        <button
          class="btn-primary-solid w-full"
          :disabled="agreementSaving || !agreementShoot || !agreementDistribute"
          @click="submitAgreement"
        >
          {{ agreementSaving ? t('photographer.creating') : t('photographer.agreementContinue') }}
        </button>
      </section>

      <section v-else-if="flowStep === 2" class="card space-y-4 p-4">
        <h2 class="font-semibold">{{ t('photographer.stepSelect') }}</h2>
        <p class="text-sm text-gray-400">{{ t('photographer.pickManyHint') }}</p>
        <input
          ref="uploadInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/*"
          class="hidden"
          :disabled="uploadInProgress"
          @change="onFilesSelected"
        >
        <button
          type="button"
          class="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-400/50 bg-brand-500/10 px-4 py-8 text-center"
          :disabled="uploadInProgress"
          @click="openPicker"
        >
          <span class="text-base font-semibold text-brand-400">{{ files.length ? t('photographer.addMoreFiles') : t('photographer.pickPhotosBtn') }}</span>
          <span class="text-xs text-gray-400">{{ t('photographer.pickManySub') }}</span>
        </button>
        <ul v-if="files.length" class="space-y-2">
          <li
            v-for="(file, index) in files"
            :key="fileKey(file)"
            class="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 text-sm"
          >
            <span class="min-w-0 truncate">{{ file.name }}</span>
            <button type="button" class="shrink-0 text-xs text-gray-400" :disabled="uploadInProgress" @click="removeFile(index)">
              {{ t('common.delete') }}
            </button>
          </li>
        </ul>
        <p v-if="files.length" class="text-sm text-gray-400">{{ t('photographer.filesPicked', { count: files.length }) }}</p>
        <button class="btn-primary-solid w-full" :disabled="uploadInProgress || !files.length" @click="upload">
          {{ t('photographer.uploadBtn', { count: files.length }) }}
        </button>
      </section>

      <section v-else-if="flowStep === 3" class="card space-y-3 p-4">
        <h2 class="font-semibold">{{ t('photographer.stepUpload') }}</h2>
        <p v-if="files.length && uploadPhase === 'idle'" class="text-sm text-gray-400">{{ t('photographer.filesPicked', { count: files.length }) }}</p>
        <button
          v-if="uploadPhase === 'idle'"
          class="btn-primary-solid w-full"
          :disabled="!files.length"
          @click="upload"
        >
          {{ t('photographer.uploadBtn', { count: files.length }) }}
        </button>
        <p v-if="uploadInProgress" class="text-sm text-gray-400">{{ t('photographer.uploadStayOpen') }}</p>
        <div v-if="uploadPhase !== 'idle'" class="space-y-2">
          <div class="h-2 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-brand-600 transition-all duration-300" :style="{ width: `${barPercent}%` }" />
          </div>
          <div class="text-sm text-gray-400">{{ progressLabel }}</div>
        </div>
        <AppAlert v-if="uploadAlert" :type="uploadAlert.type" :message="uploadAlert.message" />
        <button type="button" class="text-sm font-medium text-brand-400" :disabled="uploadInProgress" @click="goToStep(2)">
          {{ t('photographer.backToFiles') }}
        </button>
      </section>

      <section v-else class="card space-y-3 p-4">
        <h2 class="font-semibold">{{ t('photographer.stepPublish') }}</h2>
        <p v-if="!isPublished" class="text-sm text-gray-400">{{ t('photographer.publishHint') }}</p>
        <AppAlert
          v-if="!isPublished && !payoutsReady"
          type="info"
          :message="t('photographer.publishWithoutPayouts')"
        />
        <button
          class="btn-primary-solid w-full"
          :disabled="!canPublish"
          @click="publish"
        >
          {{
            isPublished
              ? t('photographer.alreadyPublishedBtn')
              : (publishing ? t('photographer.publishing') : t('photographer.publish'))
          }}
        </button>
        <AppAlert v-if="publishAlert" :type="publishAlert.type" :message="publishAlert.message" />
        <button
          v-if="!isPublished"
          type="button"
          class="text-sm font-medium text-brand-400"
          @click="goToStep(2)"
        >
          {{ t('photographer.addMorePhotos') }}
        </button>
      </section>

      <section v-if="agreementAgreed" class="card space-y-3 p-4">
        <NuxtLink :to="`/photographer/tournaments/${id}/settings`" class="block font-medium text-brand-600">
          {{ t('photographer.settingsLink') }}
        </NuxtLink>
        <NuxtLink :to="`/photographer/tournaments/${id}/photos`" class="block font-medium text-brand-600">
          {{ t('photographer.tagPhotosLink') }}
        </NuxtLink>
        <NuxtLink :to="`/photographer/tournaments/${id}/stats`" class="block font-medium text-brand-600">
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
