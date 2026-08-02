<script setup lang="ts">
defineProps<{
  name: 'home' | 'trophy' | 'heart' | 'user' | 'camera' | 'search' | 'upload' | 'face' | 'shirt' | 'bell' | 'help' | 'filter' | 'back' | 'check'
  class?: string
}>()
</script>

<template>
  <svg
    :class="class"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </template>
    <template v-else-if="name === 'trophy'">
      <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0zM5 5H3v1a3 3 0 0 0 3 3M19 5h2v1a3 3 0 0 1-3 3" />
    </template>
    <template v-else-if="name === 'heart'">
      <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.4-7 10-7 10z" />
    </template>
    <template v-else-if="name === 'user'">
      <circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0 1 14 0" />
    </template>
    <template v-else-if="name === 'camera'">
      <path d="M4 8h3l2-2h6l2 2h3v10H4z" /><circle cx="12" cy="13" r="3.5" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" />
    </template>
    <template v-else-if="name === 'upload'">
      <path d="M12 16V6M8 10l4-4 4 4" /><path d="M4 18h16" />
    </template>
    <template v-else-if="name === 'face'">
      <rect x="5" y="5" width="14" height="14" rx="3" /><circle cx="10" cy="11" r="1" /><circle cx="14" cy="11" r="1" /><path d="M9.5 15c.9.8 2.1.8 3 0" />
    </template>
    <template v-else-if="name === 'shirt'">
      <path d="M8 6 12 3l4 3 3 2v11H5V8z" />
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M12 4a4 4 0 0 0-4 4v2.5L6 13h12l-2-2.5V8a4 4 0 0 0-4-4z" /><path d="M10 17a2 2 0 0 0 4 0" />
    </template>
    <template v-else-if="name === 'help'">
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4.3 1.8c0 2-2.8 2-2.8 3.7" /><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'filter'">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </template>
    <template v-else-if="name === 'back'">
      <path d="M14 6 8 12l6 6" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="M5 12.5 9.5 17 19 7" />
    </template>
  </svg>
</template>
