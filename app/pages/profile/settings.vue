<script setup lang="ts">
definePageMeta({ middleware: 'client-auth' })

const { t } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const { locale, localeOptions, applyLocale } = useAppLocale()

const name = ref(auth.user?.name || '')
const belt = ref(auth.user?.belt || '')
const selectedLocale = ref((auth.user?.locale || locale.value) as 'ru' | 'en' | 'es')
const saving = ref(false)
const saved = ref(false)

const belts = beltOptions()

async function save() {
  saving.value = true
  saved.value = false
  try {
    await applyLocale(selectedLocale.value, false)
    const user = await api.updateProfile({
      name: name.value.trim(),
      belt: belt.value,
      locale: selectedLocale.value,
    })
    auth.setUser(user)
    saved.value = true
  } finally {
    saving.value = false
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
        <label class="block text-sm">
          <span class="text-gray-400">{{ t('settings.language') }}</span>
          <select v-model="selectedLocale" class="input-field mt-1">
            <option v-for="opt in localeOptions" :key="opt.value" :value="opt.value">{{ t(opt.labelKey) }}</option>
          </select>
        </label>
        <p class="text-xs text-gray-400">Email: {{ auth.user?.email }}</p>
        <button class="btn-primary-solid" :disabled="saving" @click="save">
          {{ saving ? t('settings.saving') : t('settings.save') }}
        </button>
        <p v-if="saved" class="text-center text-sm text-green-400">{{ t('settings.saved') }}</p>
      </div>

      <button class="w-full py-2 text-center text-sm text-gray-500" @click="auth.logout(); router.push('/')">
        {{ t('settings.logout') }}
      </button>
    </div>
  </div>
</template>
