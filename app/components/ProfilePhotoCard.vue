<script setup lang="ts">
import type { ProfilePhoto } from '~/types'

const props = defineProps<{
  photo: ProfilePhoto
}>()

const favorites = useFavoritesStore()
const api = useApi()
const toast = useToast()
const { t } = useI18n()
const downloading = ref(false)
const uiReady = ref(false)
onMounted(() => {
  uiReady.value = true
})
const isFavorite = computed(() => uiReady.value && favorites.has(props.photo.id))

function onHeart(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  favorites.toggle(props.photo.id)
}

async function onDownload(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (downloading.value) return
  downloading.value = true
  try {
    await api.downloadPhoto(props.photo.id, props.photo.original_filename)
  }
  catch (e: unknown) {
    toast.error(t(getCommonApiErrorKey(e) ?? 'checkout.downloadFailed'))
  }
  finally {
    downloading.value = false
  }
}
</script>

<template>
  <NuxtLink
    :to="`/photos/${photo.id}`"
    class="group relative block overflow-hidden rounded-xl bg-white/10"
  >
    <div class="aspect-[2/3] w-full">
      <AppImage
        :src="photo.thumbnail_url || photo.preview_url"
        :alt="photo.original_filename || 'Photo'"
        aspect="photo"
      />
    </div>

    <button
      class="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition active:scale-90"
      :aria-label="t('photoCard.favorite')"
      @click="onHeart"
    >
      <AppIcon
        name="heart"
        class="h-4 w-4"
        :class="isFavorite ? 'fill-red-500 stroke-red-500' : ''"
      />
    </button>

    <button
      v-if="photo.purchased"
      class="absolute bottom-1.5 right-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-md transition active:scale-90 disabled:opacity-60"
      :aria-label="t('profilePhotos.download')"
      :disabled="downloading"
      @click="onDownload"
    >
      <AppIcon name="download" class="h-4 w-4" />
    </button>

    <div
      v-if="photo.purchased"
      class="absolute bottom-1.5 left-1.5 rounded-md bg-green-600/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white"
    >
      {{ t('profilePhotos.purchasedBadge') }}
    </div>
    <div
      v-else
      class="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white"
    >
      ${{ photo.price.toFixed(0) }}
    </div>
  </NuxtLink>
</template>
