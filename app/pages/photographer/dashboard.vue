<script setup lang="ts">
definePageMeta({})

const { t } = useI18n()
const auth = useAuthStore()
const api = useApi()
const router = useRouter()

if (!auth.isLoggedIn) {
  await navigateTo('/photographer/login')
}

const { data, refresh, pending } = await useAsyncData('my-tournaments', () => api.getMyTournaments())

async function logout() {
  auth.logout()
  await router.push('/')
}
</script>

<template>
  <div>
    <AppPageHeader :title="t('photographer.dashboardTitle')">
      <template #right>
        <button class="text-sm font-medium text-gray-500" @click="logout">{{ t('photographer.logout') }}</button>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ auth.user?.email }}</p>
        <NuxtLink to="/photographer/tournaments/new" class="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          {{ t('photographer.addTournament') }}
        </NuxtLink>
      </div>

      <div v-if="pending" class="space-y-3">
        <div v-for="n in 3" :key="n" class="card h-24 animate-pulse bg-white/10" />
      </div>

      <div v-else-if="data?.data?.length" class="space-y-3">
        <NuxtLink
          v-for="item in data.data"
          :key="item.id"
          :to="`/photographer/tournaments/${item.id}`"
          class="card block p-3"
        >
          <div class="flex items-center gap-3">
            <div class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
              <AppImage :src="item.cover_image" :alt="item.name" aspect="square" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div class="font-semibold leading-snug">{{ item.name }}</div>
                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="item.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'"
                >
                  {{ item.status === 'published' ? t('photographer.statusPublished') : t('photographer.statusDraft') }}
                </span>
              </div>
              <div class="mt-1 text-sm text-gray-500">{{ item.photo_count }} {{ t('common.photos') }} · {{ item.slug }}</div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="card p-8 text-center text-gray-500">
        {{ t('photographer.emptyTournaments') }}
      </div>
    </div>
  </div>
</template>
