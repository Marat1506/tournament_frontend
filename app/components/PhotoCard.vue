<script setup lang="ts">
import type { Photo } from '~/types'

const props = defineProps<{
  photo: Photo
  selectable?: boolean
  athleteId?: string
  fromFaceSearch?: boolean
}>()

const favorites = useFavoritesStore()
const selection = useSelectionStore()
const faceSearch = useFaceSearchStore()
const { t } = useI18n()
const uiReady = ref(false)
onMounted(() => {
  uiReady.value = true
})

const isFavorite = computed(() => uiReady.value && favorites.has(props.photo.id))
const isSelected = computed(() => uiReady.value && selection.has(props.photo.id))
const imageSrc = computed(() => {
  const src = props.photo.thumbnail_url || props.photo.preview_url
  if (!uiReady.value || !props.fromFaceSearch) return src
  return faceSearch.mediaUrl(src)
})

const photoLink = computed(() => {
  const params = new URLSearchParams()
  if (props.fromFaceSearch) {
    params.set('from', 'face_search')
  }
  else {
    const athleteId = props.athleteId || props.photo.athlete_id
    if (athleteId) params.set('athlete_id', athleteId)
  }
  const qs = params.toString()
  return qs ? `/photos/${props.photo.id}?${qs}` : `/photos/${props.photo.id}`
})

function onHeart(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  favorites.toggle(props.photo.id)
}

function onSelect(e: Event) {
  if (!props.selectable) return
  e.preventDefault()
  e.stopPropagation()
  selection.toggle(props.photo)
}
</script>

<template>
  <NuxtLink
    :to="photoLink"
    class="group relative block overflow-hidden rounded-xl bg-white/10"
  >
    <div class="aspect-[2/3] w-full">
      <AppImage
        :src="imageSrc"
        :alt="photo.original_filename || 'Photo'"
        aspect="photo"
      />
    </div>

    <button
      class="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
      :aria-label="t('photoCard.favorite')"
      @click="onHeart"
    >
      <AppIcon
        name="heart"
        class="h-4 w-4"
        :class="isFavorite ? 'fill-red-500 stroke-red-500' : ''"
      />
    </button>

    <div class="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white">
      ${{ photo.price.toFixed(0) }}
    </div>

    <button
      v-if="selectable"
      class="absolute bottom-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm"
      :class="isSelected ? 'bg-brand-600 text-white' : 'bg-black/35 text-white'"
      :aria-label="t('photoCard.select')"
      @click="onSelect"
    >
      <AppIcon :name="isSelected ? 'check' : 'cart'" class="h-4 w-4" />
    </button>
  </NuxtLink>
</template>
