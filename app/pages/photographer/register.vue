<script setup lang="ts">
definePageMeta({ nav: 'light' })

const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
})
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const resp = await api.register({ ...form, role: 'photographer' })
    auth.setSession(resp)
    await router.push('/photographer/dashboard')
  } catch (e: unknown) {
    error.value = 'Не удалось зарегистрироваться'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader title="Регистрация фотографа" />
    <div class="page-container max-w-md">
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="form.name" type="text" class="input-field" placeholder="Имя" required>
        <input v-model="form.email" type="email" class="input-field" placeholder="Email" required>
        <input v-model="form.password" type="password" class="input-field" placeholder="Пароль (мин. 8)" minlength="8" required>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">Создать аккаунт</button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500">
        Уже есть аккаунт?
        <NuxtLink to="/photographer/login" class="font-medium text-brand-600">Войти</NuxtLink>
      </p>
    </div>
  </div>
</template>
