<script setup lang="ts">
import type { Photo, ProfilePhoto } from '~/types'

definePageMeta({ ssr: false })

const { t } = useI18n()
const route = useRoute()
const api = useApi()
const auth = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  shirt_size: '',
  message: '',
  photo_id: (route.query.photo_id as string) || '',
})

const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')
const selectedPhoto = ref<Photo | ProfilePhoto | null>(null)

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const { data: purchased } = await useAsyncData(
  'tshirt-purchased',
  () => {
    if (!auth.isLoggedIn) return Promise.resolve(null)
    return api.getProfilePhotos({ filter: 'purchased', page: 1 }).catch(() => null)
  },
  { server: false },
)

const purchasedPhotos = computed(() => purchased.value?.data ?? [])

const { data: linkedPhoto } = await useAsyncData(
  () => `tshirt-photo-${form.photo_id}`,
  () => form.photo_id ? api.getPhoto(form.photo_id).catch(() => null) : Promise.resolve(null),
  { watch: [() => form.photo_id], server: false },
)

watch([purchasedPhotos, linkedPhoto, () => form.photo_id], () => {
  const fromPurchased = purchasedPhotos.value.find(p => p.id === form.photo_id)
  selectedPhoto.value = fromPurchased || linkedPhoto.value || selectedPhoto.value
}, { immediate: true })

const mockupUrl = computed(() =>
  selectedPhoto.value?.preview_url || selectedPhoto.value?.thumbnail_url || '',
)

function selectPhoto(photo: ProfilePhoto) {
  form.photo_id = photo.id
  selectedPhoto.value = photo
}

async function submit() {
  loading.value = true
  errorMsg.value = ''
  try {
    await api.createTshirtLead({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      shirt_size: form.shirt_size || undefined,
      message: form.message || undefined,
      photo_id: form.photo_id || undefined,
    })
    success.value = true
  }
  catch (e: unknown) {
    const err = e as { data?: { error?: string } }
    errorMsg.value = err.data?.error || t('shop.submitFailed')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('shop.tshirtsTitle')">
      <template #left>
        <NuxtLink to="/" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <div v-if="success" class="card p-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
          <AppIcon name="check" class="h-7 w-7" />
        </div>
        <h2 class="text-lg font-semibold">{{ t('shop.successTitle') }}</h2>
        <p class="mt-2 text-sm text-gray-600">{{ t('shop.successHint') }}</p>
        <NuxtLink to="/" class="btn-primary-solid mt-6">{{ t('shop.home') }}</NuxtLink>
      </div>

      <div v-else class="space-y-5">
        <div class="card overflow-hidden p-4 sm:p-5">
          <TshirtMockup :image-url="mockupUrl" :alt="selectedPhoto?.original_filename" />
        </div>

        <div class="card space-y-3 p-5">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold">{{ t('shop.choosePhoto') }}</h2>
            <span v-if="purchasedPhotos.length" class="text-xs text-gray-500">
              {{ t('shop.purchasedCount', { count: purchasedPhotos.length }) }}
            </span>
          </div>
          <p class="text-sm text-gray-400">{{ t('shop.choosePhotoHint') }}</p>

          <div v-if="!auth.isLoggedIn" class="rounded-xl bg-white/5 p-4 text-sm text-gray-300">
            <p>{{ t('shop.loginToPick') }}</p>
            <NuxtLink to="/login?redirect=/shop/tshirts" class="mt-3 inline-block font-medium text-brand-500">
              {{ t('shop.login') }}
            </NuxtLink>
          </div>

          <div v-else-if="!purchasedPhotos.length" class="rounded-xl bg-white/5 p-4 text-sm text-gray-400">
            {{ t('shop.noPurchased') }}
            <NuxtLink to="/tournaments" class="mt-2 block font-medium text-brand-500">
              {{ t('shop.findPhotos') }}
            </NuxtLink>
          </div>

          <div v-else class="flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="photo in purchasedPhotos"
              :key="photo.id"
              type="button"
              class="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition"
              :class="form.photo_id === photo.id ? 'ring-brand-400' : 'ring-white/10'"
              @click="selectPhoto(photo)"
            >
              <AppImage
                :src="photo.thumbnail_url || photo.preview_url"
                :alt="photo.original_filename || t('shop.mockupAlt')"
                aspect="photo"
              />
            </button>
          </div>
        </div>

        <form class="card space-y-4 p-5" @submit.prevent="submit">
          <p class="text-sm text-gray-400">{{ t('shop.intro') }}</p>

          <input v-model="form.name" type="text" required :placeholder="t('shop.name')" class="input-field">
          <input v-model="form.email" type="email" required placeholder="Email *" class="input-field">
          <input v-model="form.phone" type="tel" :placeholder="t('shop.phone')" class="input-field">

          <select v-model="form.shirt_size" class="input-field">
            <option value="">{{ t('shop.size') }}</option>
            <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
          </select>

          <div v-if="selectedPhoto" class="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <img :src="mockupUrl" alt="" class="h-16 w-16 rounded-lg object-cover">
            <div class="min-w-0 text-sm">
              <div class="font-medium">{{ t('shop.selectedPhoto') }}</div>
              <div class="truncate text-gray-500">{{ selectedPhoto.original_filename || selectedPhoto.id.slice(0, 8) }}</div>
            </div>
          </div>

          <textarea v-model="form.message" rows="3" :placeholder="t('shop.comment')" class="input-field" />

          <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

          <button type="submit" class="btn-primary-solid w-full" :disabled="loading || !form.photo_id">
            {{ loading ? t('shop.submitting') : t('shop.submit') }}
          </button>
          <p v-if="!form.photo_id" class="text-center text-xs text-gray-500">{{ t('shop.needPhoto') }}</p>
        </form>
      </div>
    </div>
  </div>
</template>
