<script setup lang="ts">
definePageMeta({ middleware: 'client-auth', ssr: false })

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
const consentAction = ref<'unpublish' | 'revoke' | null>(null)
const consentBusy = computed(() => consentAction.value !== null)
const showPersonal = ref(true)

const belts = beltOptions()

const { data: consentSummary, refresh: refreshConsent } = await useAsyncData(
  'consent-summary',
  () => api.getConsentSummary(),
  { server: false },
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
  }
  catch (e: unknown) {
    error.value = t(getCommonApiErrorKey(e) ?? 'settings.saveFailed')
    toast.error(error.value)
  }
  finally {
    saving.value = false
  }
}

async function unpublishCatalog() {
  if (!confirm(t('settings.consentUnpublishConfirm'))) return
  consentAction.value = 'unpublish'
  try {
    await api.unpublishCatalog()
    await refreshConsent()
    toast.success(t('settings.consentUnpublished'))
  }
  catch (e: unknown) {
    toast.error(t(getCommonApiErrorKey(e) ?? 'settings.consentActionFailed'))
  }
  finally {
    consentAction.value = null
  }
}

async function revokeConsent() {
  if (!confirm(t('settings.consentRevokeConfirm'))) return
  consentAction.value = 'revoke'
  try {
    await api.revokeConsent()
    await refreshConsent()
    toast.success(t('settings.consentRevoked'))
  }
  catch (e: unknown) {
    toast.error(t(getCommonApiErrorKey(e) ?? 'settings.consentActionFailed'))
  }
  finally {
    consentAction.value = null
  }
}

async function logout() {
  auth.logout()
  await router.push('/')
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
      <div class="card flex items-center gap-3 p-4">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-400">
          <AppIcon name="user" class="h-7 w-7" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-lg font-semibold">{{ auth.user?.name || auth.user?.email }}</div>
          <div class="truncate text-sm text-gray-400">{{ auth.user?.email }}</div>
        </div>
      </div>

      <button type="button" class="cabinet-row w-full text-left" @click="showPersonal = !showPersonal">
        <span class="icon-tile">
          <AppIcon name="user" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">{{ t('settings.personalData') }}</span>
          <span class="block text-sm text-gray-400">{{ t('settings.personalDataHint') }}</span>
        </span>
        <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-500 transition" :class="showPersonal ? 'rotate-90' : ''" />
      </button>

      <div v-if="showPersonal" class="card space-y-4 p-4">
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
          <span v-if="saving" class="loading-spinner" aria-hidden="true" />
          {{ saving ? t('settings.saving') : t('settings.save') }}
        </button>
        <p v-if="saved" class="text-center text-sm text-green-400">{{ t('settings.saved') }}</p>
        <AppAlert v-if="error" type="error" :message="error" />
      </div>

      <NuxtLink to="/forgot-password" class="cabinet-row">
        <span class="icon-tile">
          <AppIcon name="lock" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">{{ t('settings.password') }}</span>
          <span class="block text-sm text-gray-400">{{ t('settings.passwordHint') }}</span>
        </span>
        <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-500" />
      </NuxtLink>

      <NuxtLink to="/profile/notifications" class="cabinet-row">
        <span class="icon-tile">
          <AppIcon name="bell" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">{{ t('settings.notifications') }}</span>
          <span class="block text-sm text-gray-400">{{ t('settings.notificationsHint') }}</span>
        </span>
        <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-500" />
      </NuxtLink>

      <div class="cabinet-row">
        <span class="icon-tile">
          <AppIcon name="settings" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">{{ t('settings.language') }}</span>
          <span class="block text-sm text-gray-400">{{ t('settings.languageHint') }}</span>
        </span>
        <AppLocaleSwitcher />
      </div>

      <NuxtLink to="/support" class="cabinet-row">
        <span class="icon-tile">
          <AppIcon name="help" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-semibold">{{ t('settings.help') }}</span>
          <span class="block text-sm text-gray-400">{{ t('settings.helpHint') }}</span>
        </span>
        <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-500" />
      </NuxtLink>

      <NuxtLink to="/terms" class="cabinet-row">
        <span class="icon-tile">
          <AppIcon name="list" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1 font-semibold">{{ t('settings.terms') }}</span>
        <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-500" />
      </NuxtLink>

      <NuxtLink to="/privacy" class="cabinet-row">
        <span class="icon-tile">
          <AppIcon name="shield" class="h-5 w-5" />
        </span>
        <span class="min-w-0 flex-1 font-semibold">{{ t('settings.privacy') }}</span>
        <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-500" />
      </NuxtLink>

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
            <span v-if="consentAction === 'unpublish'" class="loading-spinner" aria-hidden="true" />
            {{ t('settings.consentUnpublish') }}
          </button>
          <button
            type="button"
            class="min-h-11 rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            :class="consentSummary.has_published_photos ? '' : 'sm:col-span-2'"
            :disabled="consentBusy"
            @click="revokeConsent"
          >
            <span v-if="consentAction === 'revoke'" class="loading-spinner mr-2 inline-block align-middle" aria-hidden="true" />
            {{ t('settings.consentRevoke') }}
          </button>
        </div>
      </div>

      <button
        type="button"
        class="w-full rounded-2xl border border-red-500/40 py-3.5 text-center text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
        @click="logout"
      >
        {{ t('settings.logout') }}
      </button>

      <p class="pb-2 text-center text-xs text-gray-500">{{ t('settings.version') }}</p>
    </div>
  </div>
</template>
