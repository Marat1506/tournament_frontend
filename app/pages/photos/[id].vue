<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const id = route.params.id as string
const api = useApi()
const favorites = useFavoritesStore()
const selection = useSelectionStore()

const faceSearch = useFaceSearchStore()

const fromFaceSearch = computed(() => route.query.from === 'face_search')

const { data: photo, error } = await useAsyncData(`photo-${id}`, async () => {
  const guestToken = fromFaceSearch.value ? faceSearch.getGuestToken() : undefined
  try {
    return await api.getPhoto(id, {
      from: fromFaceSearch.value ? 'face_search' : undefined,
      guestToken: guestToken || undefined,
    })
  }
  catch {
    return faceSearch.findPhoto(id)
  }
})

if (error.value || !photo.value) {
  throw createError({ statusCode: 404, statusMessage: t('photos.notFound') })
}
</script>

<template>
  <div v-if="photo" class="min-h-screen bg-black pb-24 text-white">
    <div class="sticky top-0 z-40 flex items-center justify-between bg-black/80 px-4 py-3 backdrop-blur">
      <button class="flex h-10 w-10 items-center justify-center" @click="$router.back()">
        <AppIcon name="back" class="h-5 w-5" />
      </button>
      <div class="flex gap-2">
        <button
          class="flex h-10 w-10 items-center justify-center"
          @click="favorites.toggle(photo.id)"
        >
          <AppIcon
            name="heart"
            class="h-5 w-5"
            :class="favorites.has(photo.id) ? 'fill-red-500 stroke-red-500' : ''"
          />
        </button>
      </div>
    </div>

    <div class="mx-auto max-h-[72vh] max-w-lg">
      <AppImage
        :src="faceSearch.mediaUrl(photo.preview_url)"
        :alt="photo.original_filename || 'Photo'"
        aspect="photo"
      />
    </div>

    <div class="mx-auto max-w-lg space-y-4 px-4 pt-5">
      <div>
        <div class="text-3xl font-bold">${{ photo.price.toFixed(0) }}</div>
        <div class="mt-1 text-sm text-white/60">{{ t('photos.previewHint') }}</div>
      </div>

      <button
        class="btn-primary-solid"
        :disabled="!selection.payoutsReady"
        @click="selection.toggle(photo)"
      >
        {{ selection.has(photo.id) ? t('photos.removeFromSelection') : t('photos.addToSelection') }}
      </button>
      <AppAlert v-if="!selection.payoutsReady" type="info" :message="t('cart.errorPayouts')" />

      <NuxtLink
        :to="`/shop/tshirts?photo_id=${photo.id}`"
        class="btn-secondary block text-center"
      >
        {{ t('photos.orderTshirt') }}
      </NuxtLink>
    </div>
  </div>
</template>
