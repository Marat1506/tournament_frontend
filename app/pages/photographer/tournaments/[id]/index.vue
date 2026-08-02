<script setup lang="ts">
definePageMeta({ nav: 'light' })

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
          message.value = 'Обработка завершена'
        }
      } catch {
        clearInterval(pollTimer)
        uploading.value = false
      }
    }, 2000)
  } catch {
    message.value = 'Ошибка загрузки'
    uploading.value = false
  }
}

async function publish() {
  try {
    await api.publishTournament(id)
    await refreshList()
    message.value = 'Турнир опубликован!'
  } catch {
    message.value = 'Сначала загрузите фото'
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
    <AppPageHeader :title="tournament?.name || 'Турнир'">
      <template #left>
        <NuxtLink to="/photographer/dashboard" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div v-if="tournament" class="page-container space-y-5">
      <div class="card p-4">
        <div class="text-sm text-gray-500">Slug (для QR)</div>
        <div class="font-mono text-sm">/t/{{ tournament.slug }}</div>
        <div class="mt-2 text-sm">Статус: <strong>{{ tournament.status }}</strong> · {{ tournament.photo_count }} фото</div>
      </div>

      <section class="card p-4 space-y-3">
        <h2 class="font-semibold">Загрузка фото</h2>
        <input type="file" multiple accept="image/*" class="block w-full text-sm" @change="onFilesSelected">
        <button class="btn-primary-solid w-full" :disabled="uploading || !files.length" @click="upload">
          {{ uploading ? 'Загрузка...' : `Загрузить (${files.length})` }}
        </button>
        <div v-if="batch" class="text-sm text-gray-600">
          Обработано: {{ batch.processed_files }} / {{ batch.total_files }}
        </div>
      </section>

      <section class="card p-4 space-y-3">
        <h2 class="font-semibold">Публикация</h2>
        <button class="btn-primary-solid w-full" :disabled="tournament.status === 'published'" @click="publish">
          Опубликовать турнир
        </button>
      </section>

      <section v-if="tournament.status === 'published'" class="card p-4 text-center">
        <h2 class="mb-3 font-semibold">QR-код для визиток</h2>
        <img v-if="qrBlobUrl" :src="qrBlobUrl" alt="QR code" class="mx-auto h-48 w-48">
        <p class="mt-2 text-xs text-gray-500">Клиенты сканируют → попадают на страницу турнира</p>
      </section>

      <p v-if="message" class="text-center text-sm font-medium text-brand-600">{{ message }}</p>
    </div>
  </div>
</template>
