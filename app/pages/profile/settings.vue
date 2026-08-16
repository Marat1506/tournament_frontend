<script setup lang="ts">
definePageMeta({ middleware: 'client-auth' })

const { t, locale } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const toast = useToast()

const name = ref(auth.user?.name || '')
const belt = ref(auth.user?.belt || '')
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const consentBusy = ref(false)

const belts = beltOptions()

const { data: consentSummary, refresh: refreshConsent } = await useAsyncData(
  'consent-summary',
  () => api.getConsentSummary(),
)

function formatConsentDate(iso?: string) {
  if (!iso) return ''
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(iso).toLocaleDateString(loc)
}

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const user = await api.updateProfile({
      name: name.value.trim(),
      belt: belt.value,
    })
    auth.setUser(user)
    saved.value = true
    toast.success(t('settings.saved'))
  } catch (e: unknown) {
    const msg = getApiErrorMessage(e)
    error.value = msg || t('settings.saveFailed')
    toast.error(error.value)
  } finally {
    saving.value = false
  }
}

async function unpublishCatalog() {
  if (!confirm(t('settings.consentUnpublishConfirm'))) return
  consentBusy.value = true
  try {
    await api.unpublishCatalog()
    await refreshConsent()
    toast.success(t('settings.consentUnpublished'))
  } catch {
    toast.error(t('settings.consentActionFailed'))
  } finally {
    consentBusy.value = false
  }
}

async function revokeConsent() {
  if (!confirm(t('settings.consentRevokeConfirm'))) return
  consentBusy.value = true
  try {
    await api.revokeConsent()
    await refreshConsent()
    toast.success(t('settings.consentRevoked'))
  } catch {
    toast.error(t('settings.consentActionFailed'))
  } finally {
    consentBusy.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('settings.title')">
      <template #left>
        <button class="flex h-10 w-10 items-center justify-center" :aria-label="t('common.back')" @click="router.back()">
          <AppIcon name="back" class="h-5 w-5" />
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4 !pt-0">
      <div class="card space-y-4 p-4">
        <label class="block text-sm">
          <span class="text-gray-400">{{ t('settings.name') }}</span>
          <input v-model="name" type="text" class="input-field mt-1" :placeholder="t('settings.namePlaceholder')">
        </label>
        <label class="block text-sm">
          <span class="text-gray-400">{{ t('settings.belt') }}</span>
          <select v-model="belt" class="input-field mt-1">
            <option value="">{{ t('settings.beltNone') }}</option>
            <option v-for="b in belts" :key="b.value" :value="b.value">{{ b.label }}</option>
          </select>
        </label>
        <p class="text-xs text-gray-400">Email: {{ auth.user?.email }}</p>
        <button class="btn-primary-solid" :disabled="saving" @click="save">
          {{ saving ? t('settings.saving') : t('settings.save') }}
        </button>
        <p v-if="saved" class="text-center text-sm text-green-400">{{ t('settings.saved') }}</p>
        <p v-if="error" class="text-center text-sm text-red-400">{{ error }}</p>
      </div>

      <div class="card space-y-4 p-4">
        <div>
          <h2 class="font-semibold">{{ t('settings.consentTitle') }}</h2>
          <p class="mt-1 text-sm text-gray-400">{{ t('settings.consentIntro') }}</p>
        </div>

        <div v-if="consentSummary?.has_personal_consent" class="rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-200 ring-1 ring-green-500/20">
          <p>{{ t('settings.consentGiven') }}</p>
          <p v-if="consentSummary.last_consent_at" class="mt-1 text-green-300/80">
            {{ t('settings.consentGivenDate', { date: formatConsentDate(consentSummary.last_consent_at) }) }}
          </p>
          <p v-if="consentSummary.last_tournament_name" class="mt-1 text-green-300/80">
            {{ t('settings.consentGivenTournament', { name: consentSummary.last_tournament_name }) }}
          </p>
        </div>
        <div v-else class="rounded-xl bg-white/5 px-4 py-3 text-sm text-gray-400 ring-1 ring-white/10">
          {{ t('settings.consentNone') }}
        </div>

        <p v-if="consentSummary?.has_published_photos" class="text-sm text-gray-400">
          {{ t('settings.consentPublishedHint') }}
        </p>

        <div v-if="consentSummary?.has_personal_consent" class="grid gap-2 sm:grid-cols-2">
          <button
            v-if="consentSummary.has_published_photos"
            type="button"
            class="btn-secondary"
            :disabled="consentBusy"
            @click="unpublishCatalog"
          >
            {{ t('settings.consentUnpublish') }}
          </button>
          <button
            type="button"
            class="rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            :class="consentSummary.has_published_photos ? '' : 'sm:col-span-2'"
            :disabled="consentBusy"
            @click="revokeConsent"
          >
            {{ t('settings.consentRevoke') }}
          </button>
        </div>
      </div>

      <button class="w-full py-2 text-center text-sm text-gray-500" @click="auth.logout(); router.push('/')">
        {{ t('settings.logout') }}
      </button>
    </div>
  </div>
</template>
