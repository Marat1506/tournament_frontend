<script setup lang="ts">
definePageMeta({ middleware: 'client-auth' })

const { t, locale } = useI18n()
const api = useApi()
const router = useRouter()

const { data, pending } = await useAsyncData('profile-tournaments', () => api.getProfileTournaments())

function formatDate(iso?: string) {
  if (!iso) return ''
  const loc = locale.value === 'ru' ? 'ru-RU' : locale.value === 'es' ? 'es-ES' : 'en-US'
  return new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('profileTournaments.title')">
      <template #left>
        <button class="flex h-10 w-10 items-center justify-center" :aria-label="t('common.back')" @click="router.back()">
          <AppIcon name="back" class="h-5 w-5" />
        </button>
      </template>
    </AppPageHeader>

    <div class="page-container space-y-3 !pt-0">
      <div v-if="pending" class="space-y-3">
        <div v-for="n in 4" :key="n" class="card h-20 animate-pulse bg-white/10" />
      </div>

      <NuxtLink
        v-for="t in data?.data"
        :key="t.id"
        :to="`/profile/photos?tournament_id=${t.id}`"
        class="card flex items-center gap-3 p-4 transition active:scale-[0.99]"
      >
        <div class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
          <AppImage :src="t.cover_image" aspect="square" :alt="t.name" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate font-semibold">{{ t.name }}</div>
          <div v-if="t.date" class="text-xs text-gray-500">{{ formatDate(t.date) }}</div>
          <div class="mt-1 text-sm text-gray-600">
            {{ t('profileTournaments.stats', { found: t.found_count, purchased: t.purchased_count }) }}
          </div>
        </div>
        <AppIcon name="chevron" class="h-5 w-5 shrink-0 text-gray-300" />
      </NuxtLink>

      <p v-if="!pending && !data?.data?.length" class="py-8 text-center text-sm text-gray-500">
        {{ t('profileTournaments.empty') }}
      </p>

      <NuxtLink to="/tournaments" class="block py-4 text-center text-sm font-medium text-brand-600">
        {{ t('profileTournaments.showAll') }}
      </NuxtLink>
    </div>
  </div>
</template>
