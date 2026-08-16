<script setup lang="ts">
const props = defineProps<{
  world: 'client' | 'photographer'
}>()

const auth = useAuthStore()
const { t } = useI18n()

const show = computed(() => {
  if (!auth.isLoggedIn) return false
  if (props.world === 'client') return auth.isPhotographer || auth.isAdmin
  return auth.user?.role === 'client'
})

function logout() {
  auth.logout()
}
</script>

<template>
  <div v-if="show" class="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
    <p v-if="world === 'client'">
      {{ t('auth.sessionPhotographer', { email: auth.user?.email }) }}
    </p>
    <p v-else>
      {{ t('auth.sessionClient', { email: auth.user?.email }) }}
    </p>
    <div class="mt-3 flex flex-wrap gap-3">
      <NuxtLink
        v-if="world === 'client' && auth.isPhotographer"
        to="/photographer/dashboard"
        class="font-medium text-brand-400"
      >
        {{ t('profile.photographerDashboard') }}
      </NuxtLink>
      <NuxtLink
        v-else-if="world === 'client' && auth.isAdmin"
        to="/admin"
        class="font-medium text-brand-400"
      >
        {{ t('profile.adminPanel') }}
      </NuxtLink>
      <NuxtLink
        v-else
        to="/profile"
        class="font-medium text-brand-400"
      >
        {{ t('profile.cabinet') }}
      </NuxtLink>
      <button type="button" class="text-gray-400" @click="logout">
        {{ t('profile.logout') }}
      </button>
    </div>
  </div>
</template>
