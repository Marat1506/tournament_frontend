<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const api = useApi()

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

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const { data: linkedPhoto } = await useAsyncData(
  () => `tshirt-photo-${form.photo_id}`,
  () => form.photo_id ? api.getPhoto(form.photo_id) : Promise.resolve(null),
  { watch: [() => form.photo_id] },
)

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
        <NuxtLink to="/" class="btn-primary-solid mt-6 inline-block">{{ t('shop.home') }}</NuxtLink>
      </div>

      <form v-else class="card space-y-4 p-5" @submit.prevent="submit">
        <p class="text-sm text-gray-600">{{ t('shop.intro') }}</p>

        <input v-model="form.name" type="text" required :placeholder="t('shop.name')" class="input-field">
        <input v-model="form.email" type="email" required placeholder="Email *" class="input-field">
        <input v-model="form.phone" type="tel" :placeholder="t('shop.phone')" class="input-field">

        <select v-model="form.shirt_size" class="input-field">
          <option value="">{{ t('shop.size') }}</option>
          <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
        </select>

        <div v-if="linkedPhoto" class="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <img :src="linkedPhoto.thumbnail_url || linkedPhoto.preview_url" alt="" class="h-16 w-16 rounded-lg object-cover">
          <div class="min-w-0 text-sm">
            <div class="font-medium">{{ t('shop.selectedPhoto') }}</div>
            <div class="truncate text-gray-500">{{ linkedPhoto.original_filename || linkedPhoto.id.slice(0, 8) }}</div>
          </div>
        </div>
        <input v-else v-model="form.photo_id" type="text" :placeholder="t('shop.photoId')" class="input-field">

        <textarea v-model="form.message" rows="3" :placeholder="t('shop.comment')" class="input-field" />

        <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>

        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? t('shop.submitting') : t('shop.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>
