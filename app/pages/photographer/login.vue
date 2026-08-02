<script setup lang="ts">
definePageMeta({ nav: 'light' })

const api = useApi()
const auth = useAuthStore()
const router = useRouter()

const email = ref('photographer@bjjphotos.local')
const password = ref('password123')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const resp = await api.login({ email: email.value, password: password.value })
    auth.setSession(resp)
    await router.push('/photographer/dashboard')
  } catch {
    error.value = 'Неверный email или пароль'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <AppPageHeader title="Вход для фотографа" />
    <div class="page-container max-w-md">
      <form class="space-y-4" @submit.prevent="submit">
        <input v-model="email" type="email" class="input-field" placeholder="Email" required>
        <input v-model="password" type="password" class="input-field" placeholder="Пароль" required>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <button type="submit" class="btn-primary-solid w-full" :disabled="loading">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
      <p class="mt-4 text-center text-sm text-gray-500">
        Нет аккаунта?
        <NuxtLink to="/photographer/register" class="font-medium text-brand-600">Регистрация</NuxtLink>
      </p>
    </div>
  </div>
</template>
