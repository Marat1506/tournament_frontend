<script setup lang="ts">
definePageMeta({ nav: 'light' })

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
    <AppPageHeader title="Кабинет фотографа">
      <template #right>
        <button class="text-sm font-medium text-gray-500" @click="logout">Выйти</button>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ auth.user?.email }}</p>
        <NuxtLink to="/photographer/tournaments/new" class="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          + Турнир
        </NuxtLink>
      </div>

      <div v-if="pending" class="space-y-3">
        <div v-for="n in 3" :key="n" class="card h-20 animate-pulse bg-gray-100" />
      </div>

      <div v-else-if="data?.data?.length" class="space-y-3">
        <NuxtLink
          v-for="t in data.data"
          :key="t.id"
          :to="`/photographer/tournaments/${t.id}`"
          class="card block p-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="font-semibold">{{ t.name }}</div>
              <div class="text-sm text-gray-500">{{ t.slug }} · {{ t.photo_count }} фото</div>
            </div>
            <span class="rounded-full px-2 py-1 text-xs font-medium" :class="t.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
              {{ t.status }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="card p-8 text-center text-gray-500">
        Пока нет турниров. Создайте первый.
      </div>
    </div>
  </div>
</template>
