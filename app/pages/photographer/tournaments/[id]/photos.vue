<script setup lang="ts">
import type { Photo } from '~/types'

definePageMeta({})

const { t } = useI18n()
const auth = useAuthStore()
const route = useRoute()
const api = useApi()
const id = route.params.id as string
const { genderOptions, beltOptions, ageGroupOptions, weightClassOptions } = useCategoryFilterOptions()

if (!auth.isLoggedIn) {
  await navigateTo('/photographer/login')
}

const filter = ref<'untagged' | 'tagged' | 'all'>('untagged')
const { data: photos, pending, refresh } = await useAsyncData(
  () => `photographer-photos-${id}-${filter.value}`,
  () => api.getPhotographerPhotos(id, { tagged: filter.value, limit: 100 }),
  { watch: [filter] },
)

const tagging = ref<Photo | null>(null)
const tagForm = reactive({ name: '', category: '', gender: '', belt: '', age_group: '', weight_class: '' })
const tagLoading = ref(false)
const tagError = ref('')
const tagSuccess = ref('')
const deleteLoading = ref(false)

const filterOptions = computed(() => [
  { id: 'untagged' as const, label: t('photographer.filterUntagged') },
  { id: 'tagged' as const, label: t('photographer.filterTagged') },
  { id: 'all' as const, label: t('photographer.filterAll') },
])

function openTag(photo: Photo) {
  tagging.value = photo
  tagForm.name = photo.athlete_name || ''
  tagForm.category = photo.athlete_category || ''
  tagForm.gender = photo.athlete_gender || ''
  tagForm.belt = photo.athlete_belt || ''
  tagForm.age_group = photo.athlete_age_group || ''
  tagForm.weight_class = photo.athlete_weight_class || ''
  tagError.value = ''
  tagSuccess.value = ''
}

function closeTag() {
  tagging.value = null
}

async function saveTag() {
  if (!tagging.value || !tagForm.name.trim()) {
    tagError.value = t('photographer.nameRequired')
    return
  }
  tagLoading.value = true
  tagError.value = ''
  try {
    await api.tagPhoto(tagging.value.id, {
      name: tagForm.name.trim(),
      category: tagForm.category.trim() || undefined,
      gender: tagForm.gender || undefined,
      belt: tagForm.belt || undefined,
      age_group: tagForm.age_group || undefined,
      weight_class: tagForm.weight_class || undefined,
    })
    tagSuccess.value = t('photographer.saved')
    await refresh()
    setTimeout(closeTag, 400)
  } catch {
    tagError.value = t('photographer.saveFailed')
  } finally {
    tagLoading.value = false
  }
}

async function deletePhoto() {
  if (!tagging.value || !confirm(t('photographer.deleteConfirm'))) return
  deleteLoading.value = true
  tagError.value = ''
  try {
    await api.deletePhoto(tagging.value.id)
    await refresh()
    closeTag()
  } catch {
    tagError.value = t('photographer.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.taggingTitle')">
      <template #left>
        <NuxtLink :to="`/photographer/tournaments/${id}`" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-4">
      <div class="flex gap-2">
        <button
          v-for="opt in filterOptions"
          :key="opt.id"
          class="chip"
          :class="filter === opt.id ? 'chip-active' : 'chip-inactive'"
          @click="filter = opt.id"
        >
          {{ opt.label }}
        </button>
      </div>

      <div v-if="pending" class="grid grid-cols-3 gap-2">
        <div v-for="n in 6" :key="n" class="aspect-square animate-pulse rounded-xl bg-white/10" />
      </div>

      <div v-else-if="photos?.data?.length" class="grid grid-cols-3 gap-2">
        <button
          v-for="photo in photos.data"
          :key="photo.id"
          class="group relative aspect-square overflow-hidden rounded-xl bg-white/10"
          @click="openTag(photo)"
        >
          <img
            v-if="photo.thumbnail_url || photo.preview_url"
            :src="photo.thumbnail_url || photo.preview_url"
            :alt="photo.original_filename || 'Photo'"
            class="h-full w-full object-cover"
          >
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
            <div v-if="photo.athlete_name" class="truncate text-xs font-medium text-white">{{ photo.athlete_name }}</div>
            <div v-else class="text-xs text-white/80">{{ t('photographer.noTag') }}</div>
          </div>
        </button>
      </div>

      <div v-if="tagging" class="fixed inset-0 z-50 flex items-end bg-black/60" @click.self="closeTag">
        <div class="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-[#151b28] p-4 pb-8">
          <h3 class="mb-4 text-lg font-bold">{{ t('photographer.tagModalTitle') }}</h3>
          <div class="space-y-3">
            <input v-model="tagForm.name" class="input-field" :placeholder="t('photographer.athleteName')">
            <input v-model="tagForm.category" class="input-field" :placeholder="t('photographer.category')">
            <select v-model="tagForm.gender" class="input-field">
              <option value="">{{ t('photographer.gender') }}</option>
              <option v-for="o in genderOptions.filter(x => x.value)" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <select v-model="tagForm.belt" class="input-field">
              <option v-for="o in beltOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <select v-model="tagForm.age_group" class="input-field">
              <option v-for="o in ageGroupOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <select v-model="tagForm.weight_class" class="input-field">
              <option v-for="o in weightClassOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <p v-if="tagError" class="mt-3 text-sm text-red-500">{{ tagError }}</p>
          <p v-if="tagSuccess" class="mt-3 text-sm text-green-500">{{ tagSuccess }}</p>
          <div class="mt-4 flex flex-col gap-2">
            <button class="btn-primary-solid" :disabled="tagLoading" @click="saveTag">{{ t('common.save') }}</button>
            <button class="text-sm text-red-500" :disabled="deleteLoading" @click="deletePhoto">{{ t('photographer.deletePhoto') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
