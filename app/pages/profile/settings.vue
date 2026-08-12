<script setup lang="ts">
definePageMeta({ middleware: 'client-auth' })

const { t } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()
const toast = useToast()

const name = ref(auth.user?.name || '')
const belt = ref(auth.user?.belt || '')
const photosPublic = ref(auth.user?.photos_public ?? false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const belts = beltOptions()

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const user = await api.updateProfile({
      name: name.value.trim(),
      belt: belt.value,
      photos_public: photosPublic.value,
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
        <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-3">
          <input v-model="photosPublic" type="checkbox" class="mt-1 h-4 w-4 rounded border-gray-500">
          <span class="text-sm">
            <span class="block font-medium text-gray-200">{{ t('settings.photosPublic') }}</span>
            <span class="mt-1 block text-gray-400">{{ t('settings.photosPublicHint') }}</span>
          </span>
        </label>
        <p class="text-xs text-gray-400">Email: {{ auth.user?.email }}</p>
        <button class="btn-primary-solid" :disabled="saving" @click="save">
          {{ saving ? t('settings.saving') : t('settings.save') }}
        </button>
        <p v-if="saved" class="text-center text-sm text-green-400">{{ t('settings.saved') }}</p>
        <p v-if="error" class="text-center text-sm text-red-400">{{ error }}</p>
      </div>

      <button class="w-full py-2 text-center text-sm text-gray-500" @click="auth.logout(); router.push('/')">
        {{ t('settings.logout') }}
      </button>
    </div>
  </div>
</template>
