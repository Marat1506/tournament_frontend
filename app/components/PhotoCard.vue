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
const { t } = useI18n()

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
        :src="photo.thumbnail_url || photo.preview_url"
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
        :class="favorites.has(photo.id) ? 'fill-red-500 stroke-red-500' : ''"
      />
    </button>

    <div class="absolute bottom-1.5 left-1.5 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white">
      ${{ photo.price.toFixed(0) }}
    </div>

    <button
      v-if="selectable"
      class="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white/95 text-xs font-bold"
      :class="selection.has(photo.id) ? 'border-brand-600 text-brand-600' : 'border-gray-300 text-transparent'"
      :aria-label="t('photoCard.select')"
      @click="onSelect"
    >
      <AppIcon v-if="selection.has(photo.id)" name="check" class="h-4 w-4" />
    </button>
  </NuxtLink>
</template>
