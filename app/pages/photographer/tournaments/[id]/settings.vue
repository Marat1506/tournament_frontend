<script setup lang="ts">
definePageMeta({ middleware: 'photographer-auth', ssr: false })

const { t } = useI18n()
const route = useRoute()
const api = useApi()
const toast = useToast()
const id = route.params.id as string

const { data: tournaments, refresh, error: loadError } = await useAsyncData('my-tournaments-settings', () => api.getMyTournaments(), { server: false })
const tournament = computed(() => tournaments.value?.data?.find(item => item.id === id))

const form = reactive({
  name: '',
  date: '',
  location: '',
  organizer: '',
  price_single: 20,
  price_bundle: 50,
})

const saving = ref(false)
const error = ref('')

watch(tournament, (t) => {
  if (!t) return
  form.name = t.name
  form.date = t.date ? t.date.slice(0, 10) : ''
  form.location = t.location || ''
  form.organizer = t.organizer || ''
  form.price_single = t.price_single
  form.price_bundle = t.price_bundle
}, { immediate: true })

const MIN_PHOTO_PRICE = 10

async function save() {
  if (!form.name.trim()) {
    error.value = t('photographer.errNameRequired')
    return
  }
  if (form.price_single < MIN_PHOTO_PRICE || form.price_bundle < MIN_PHOTO_PRICE || form.price_bundle < form.price_single) {
    error.value = t('photographer.errInvalidPrices')
    return
  }
  saving.value = true
  error.value = ''
  try {
    await api.updateTournament(id, {
      name: form.name.trim(),
      date: form.date || undefined,
      location: form.location.trim() || undefined,
      organizer: form.organizer.trim() || undefined,
      price_single: form.price_single,
      price_bundle: form.price_bundle,
    })
    await refresh()
    await refreshNuxtData('my-tournaments-detail')
    toast.success(t('photographer.settingsSaved'))
  } catch (e: unknown) {
    error.value = getApiErrorMessage(e) || t('photographer.settingsSaveFailed')
    toast.error(error.value)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.tabEdit')">
      <template #left>
        <NuxtLink :to="`/photographer/tournaments/${id}`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
      <template #right>
        <button
          type="button"
          class="rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? t('settings.saving') : t('common.save') }}
        </button>
      </template>
    </AppPageHeader>

    <div v-if="loadError" class="page-container">
      <AppAlert type="error" :message="t('photographer.loadDetailFailed')" />
    </div>

    <div v-else-if="!tournament" class="page-container">
      <AppAlert type="error" :message="t('photographer.errNotFound')" />
    </div>

    <div v-else class="page-container max-w-lg space-y-4">
      <PhotographerEventTabs :id="id" active="edit" />

      <div class="card flex gap-3 p-3">
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5">
          <AppImage :src="tournament.cover_image" :alt="tournament.name" aspect="square" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ tournament.name }}</div>
          <span
            class="mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
            :class="tournament.status === 'published' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-400'"
          >
            {{ tournament.status === 'published' ? t('photographer.statusPublished') : t('photographer.statusDraft') }}
          </span>
        </div>
      </div>

      <p class="text-sm text-gray-400">{{ t('photographer.settingsHint') }}</p>

      <form class="card space-y-4 p-4" @submit.prevent="save">
        <label class="block text-sm">
          <span class="text-gray-400">{{ t('photographer.tournamentName') }}</span>
          <input v-model="form.name" class="input-field mt-1" required>
        </label>
        <label class="block text-sm">
          <span class="text-gray-400">{{ t('photographer.tournamentDate') }}</span>
          <input v-model="form.date" type="date" class="input-field mt-1">
        </label>
        <label class="block text-sm">
          <span class="text-gray-400">{{ t('photographer.tournamentLocation') }}</span>
          <input v-model="form.location" class="input-field mt-1">
        </label>
        <label class="block text-sm">
          <span class="text-gray-400">{{ t('photographer.organizer') }}</span>
          <input v-model="form.organizer" class="input-field mt-1">
        </label>
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

        <AppAlert v-if="error" type="error" :message="error" />

        <button type="submit" class="btn-primary-solid w-full" :disabled="saving">
          {{ saving ? t('settings.saving') : t('common.save') }}
        </button>
      </form>

      <NuxtLink :to="`/photographer/tournaments/${id}/photos`" class="cabinet-row">
        <div class="icon-tile">
          <AppIcon name="photos" class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="font-semibold">{{ t('photographer.tagPhotos') }}</div>
        </div>
        <AppIcon name="chevron" class="h-5 w-5 text-gray-500" />
      </NuxtLink>
    </div>
  </div>
</template>
