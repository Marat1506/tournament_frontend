<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()

if (!auth.isLoggedIn) {
  await navigateTo('/photographer/login')
}

const form = reactive({
  name: '',
  date: '',
  location: '',
  organizer: 'IBJJF',
  price_single: 20,
  price_bundle: 50,
})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref('')

function onCoverSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  coverFile.value = file
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = URL.createObjectURL(file)
}

function pickCover() {
  coverInput.value?.click()
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const tournament = await api.createTournament({ ...form })
    if (coverFile.value) {
      await api.uploadTournamentCover(tournament.id, coverFile.value)
    }
    await router.push(`/photographer/tournaments/${tournament.id}`)
  } catch {
    error.value = t('photographer.createFailed')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
})
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.newTournamentTitle')">
      <template #left>
        <NuxtLink to="/photographer/dashboard" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container max-w-lg">
      <p class="mb-4 text-sm font-medium text-gray-700">{{ t('photographer.tournamentInfo') }}</p>

      <form class="space-y-4" @submit.prevent="submit">
        <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onCoverSelected">

        <button
          type="button"
          class="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 py-8 transition hover:border-brand-400 hover:bg-brand-600/10"
          @click="pickCover"
        >
          <div v-if="coverPreview" class="h-28 w-28 overflow-hidden rounded-xl ring-2 ring-brand-200">
            <img :src="coverPreview" :alt="t('photographer.coverAlt')" class="h-full w-full object-cover">
          </div>
          <div v-else class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <AppIcon name="upload" class="h-7 w-7" />
          </div>
          <span class="text-sm font-medium text-brand-600">
            {{ coverPreview ? t('photographer.changeCover') : t('photographer.addCover') }}
          </span>
          <span class="text-xs text-gray-500">{{ t('photographer.coverHint') }}</span>
        </button>

        <input v-model="form.name" class="input-field" :placeholder="`${t('photographer.tournamentName')} *`" required>
        <input v-model="form.date" type="date" class="input-field">
        <input v-model="form.location" class="input-field" :placeholder="t('photographer.tournamentLocation')">
        <input v-model="form.organizer" class="input-field" :placeholder="t('photographer.organizer')">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs text-gray-500">{{ t('photographer.priceSingle') }}</label>
            <input v-model.number="form.price_single" type="number" class="input-field">
          </div>
          <div>
            <label class="mb-1 block text-xs text-gray-500">{{ t('photographer.priceBundleShort') }}</label>
            <input v-model.number="form.price_bundle" type="number" class="input-field">
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('photographer.creating') : t('photographer.create') }}
        </button>
      </form>
    </div>
  </div>
</template>
