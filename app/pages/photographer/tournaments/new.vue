<script setup lang="ts">
definePageMeta({ middleware: 'photographer-auth', ssr: false })

const { t } = useI18n()
const api = useApi()
const router = useRouter()
const toast = useToast()

const { data: platform } = await useAsyncData('platform-defaults-new', () => api.getPlatformHome(), { server: false })

const form = reactive({
  name: '',
  date: '',
  location: '',
  organizer: 'IBJJF',
  price_single: 20,
  price_bundle: 50,
})

watch(platform, (p) => {
  if (!p) return
  form.price_single = p.default_price_single
  form.price_bundle = p.default_price_bundle
}, { immediate: true })

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const coverInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref('')
const wizardStep = ref(1)
const feePercent = computed(() => 10)

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

function goNext() {
  error.value = ''
  if (!form.name.trim()) {
    error.value = t('photographer.errNameRequired')
    return
  }
  wizardStep.value = 2
}

const MIN_PHOTO_PRICE = 10

async function submit() {
  if (form.price_single < MIN_PHOTO_PRICE || form.price_bundle < MIN_PHOTO_PRICE || form.price_bundle < form.price_single) {
    error.value = t('photographer.errInvalidPrices')
    return
  }
  loading.value = true
  error.value = ''
  let tournamentId = ''
  try {
    const tournament = await api.createTournament({ ...form })
    tournamentId = tournament.id
    if (coverFile.value) {
      try {
        await api.uploadTournamentCover(tournament.id, coverFile.value)
      } catch {
        toast.error(t('photographer.createCoverFailed'))
        await router.push(`/photographer/tournaments/${tournament.id}`)
        return
      }
    }
    toast.success(t('photographer.tournamentCreated'))
    await router.push(`/photographer/tournaments/${tournament.id}`)
  } catch (e: unknown) {
    if (tournamentId) {
      error.value = t('photographer.createCoverFailed')
    } else {
      const key = mapApiError(e, [
        { match: 'name is required', key: 'photographer.errNameRequired' },
        { match: 'unsupported', key: 'photographer.errUnsupportedImage' },
      ], 'photographer.createFailed')
      error.value = t(key)
    }
    toast.error(error.value)
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
      <p class="mb-4 text-sm text-gray-400">{{ t('photographer.flowStepOf', { current: wizardStep, total: 2 }) }}</p>
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" :class="wizardStep >= 1 ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-500'">1</div>
        <span class="text-sm font-medium" :class="wizardStep === 1 ? 'text-white' : 'text-gray-400'">{{ t('photographer.newStepEvent') }}</span>
        <div class="h-0.5 flex-1 rounded-full" :class="wizardStep > 1 ? 'bg-brand-600' : 'bg-white/10'" />
        <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" :class="wizardStep >= 2 ? 'bg-brand-600 text-white' : 'bg-white/10 text-gray-500'">2</div>
        <span class="text-sm font-medium" :class="wizardStep === 2 ? 'text-white' : 'text-gray-400'">{{ t('photographer.newStepPrices') }}</span>
      </div>

      <form class="space-y-4" @submit.prevent="wizardStep === 1 ? goNext() : submit()">
        <input ref="coverInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onCoverSelected">

        <template v-if="wizardStep === 1">
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
        </template>

        <template v-else>
          <p class="text-sm leading-relaxed text-gray-400">{{ t('photographer.newPricesHint', { percent: feePercent }) }}</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs text-gray-500">{{ t('photographer.priceSingle') }}</label>
              <input v-model.number="form.price_single" type="number" min="10" step="0.01" class="input-field">
            </div>
            <div>
              <label class="mb-1 block text-xs text-gray-500">{{ t('photographer.priceBundleShort') }}</label>
              <input v-model.number="form.price_bundle" type="number" min="10" step="0.01" class="input-field">
            </div>
          </div>
          <p class="text-sm leading-relaxed text-gray-400">{{ t('photographer.newSlotHint') }}</p>
        </template>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <div class="flex gap-3">
          <button
            v-if="wizardStep === 2"
            type="button"
            class="btn-secondary flex-1 justify-center"
            :disabled="loading"
            @click="wizardStep = 1"
          >
            {{ t('common.back') }}
          </button>
          <button type="submit" class="btn-primary-solid flex-1" :disabled="loading">
            <template v-if="wizardStep === 1">{{ t('common.continue') }}</template>
            <template v-else>{{ loading ? t('photographer.creating') : t('photographer.create') }}</template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
