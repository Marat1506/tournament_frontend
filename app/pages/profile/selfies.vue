<script setup lang="ts">
definePageMeta({ middleware: 'client-auth', ssr: false })

const { t, locale } = useI18n()
const api = useApi()
const router = useRouter()

const { data, pending } = await useAsyncData('profile-selfies', () => api.getProfileSelfies(), { server: false })

const typeLabels = computed<Record<string, string>>(() => ({
  face: t('profileSelfies.searchFace'),
  name: t('profileSelfies.searchName'),
  face_search: t('profileSelfies.searchFace'),
  name_search: t('profileSelfies.searchName'),
}))

function formatDate(iso: string) {
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(iso).toLocaleString(loc)
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('profileSelfies.title')">
      <template #left>
        <button class="flex h-10 w-10 items-center justify-center" :aria-label="t('common.back')" @click="router.back()">
          <AppIcon name="back" class="h-5 w-5" />
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-3 !pt-0">
      <p class="text-sm text-gray-500">
        {{ t('profileSelfies.hint') }}
      </p>

      <div v-if="pending" class="space-y-3">
        <div v-for="n in 3" :key="n" class="card h-16 animate-pulse bg-white/10" />
      </div>

      <div v-for="s in data?.data" :key="s.id" class="card p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="font-medium">{{ typeLabels[s.search_type] || s.search_type }}</div>
            <div v-if="s.tournament_name" class="text-sm text-gray-600">{{ s.tournament_name }}</div>
            <div class="text-xs text-gray-400">{{ formatDate(s.created_at) }}</div>
          </div>
          <div class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            {{ s.result_count }} {{ t('common.photos') }}
          </div>
        </div>
      </div>

      <p v-if="!pending && !data?.data?.length" class="py-8 text-center text-sm text-gray-500">
        {{ t('profileSelfies.empty') }}
      </p>

      <NuxtLink to="/tournaments" class="btn-primary-solid mt-2">
        {{ t('profileSelfies.findNew') }}
      </NuxtLink>
    </div>
  </div>
</template>
