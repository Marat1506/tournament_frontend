<script setup lang="ts">
definePageMeta({ nav: 'light' })

const auth = useAuthStore()
const api = useApi()
const router = useRouter()

if (!auth.isLoggedIn) {
  await navigateTo('/photographer/login')
}

const form = reactive({
  name: '',
  date: '',
  location: '',
  organizer: 'IBJJF',
  price_single: 20,
  price_bundle: 50,
})
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const t = await api.createTournament({ ...form })
    await router.push(`/photographer/tournaments/${t.id}`)
  } catch {
    error.value = 'Не удалось создать турнир'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader title="Новый турнир">
      <template #left>
        <NuxtLink to="/photographer/dashboard" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container max-w-lg">
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="form.name" class="input-field" placeholder="Название турнира" required>
        <input v-model="form.date" type="date" class="input-field">
        <input v-model="form.location" class="input-field" placeholder="Город">
        <input v-model="form.organizer" class="input-field" placeholder="Организатор">
        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="form.price_single" type="number" class="input-field" placeholder="Цена за фото ($)">
          <input v-model.number="form.price_bundle" type="number" class="input-field" placeholder="Комплект ($)">
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">Создать</button>
      </form>
    </div>
  </div>
</template>
