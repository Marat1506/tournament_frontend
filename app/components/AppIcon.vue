<script setup lang="ts">
const props = defineProps<{
  name: 'home' | 'trophy' | 'heart' | 'user' | 'camera' | 'search' | 'upload' | 'face' | 'shirt' | 'bell' | 'help' | 'filter' | 'back' | 'check' | 'settings' | 'chevron' | 'cart' | 'photos' | 'mail' | 'download' | 'calendar' | 'pin' | 'wallet' | 'chart' | 'lock' | 'shield' | 'star' | 'grid' | 'list' | 'plus' | 'trash' | 'pencil' | 'phone' | 'sparkles' | 'clock'
  class?: string
}>()
</script>

<template>
  <ClientOnly>
    <svg
      class="block shrink-0"
      :class="props.class"
      xmlns="http://www.w3.org/2000/svg"
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
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </template>
      <template v-else-if="name === 'camera'">
        <path d="M4 8h3l2-2h6l2 2h3v10H4z" />
        <circle cx="12" cy="13" r="3.5" />
      </template>
      <template v-else-if="name === 'search'">
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </template>
      <template v-else-if="name === 'upload'">
        <path d="M12 16V6M8 10l4-4 4 4" />
        <path d="M4 18h16" />
      </template>
      <template v-else-if="name === 'face'">
        <rect x="5" y="5" width="14" height="14" rx="3" />
        <circle cx="10" cy="11" r="1" />
        <circle cx="14" cy="11" r="1" />
        <path d="M9.5 15c.9.8 2.1.8 3 0" />
      </template>
      <template v-else-if="name === 'shirt'">
        <path d="M8 6 12 3l4 3 3 2v11H5V8z" />
      </template>
      <template v-else-if="name === 'bell'">
        <path d="M12 4a4 4 0 0 0-4 4v2.5L6 13h12l-2-2.5V8a4 4 0 0 0-4-4z" />
        <path d="M10 17a2 2 0 0 0 4 0" />
      </template>
      <template v-else-if="name === 'help'">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 0 1 4.3 1.8c0 2-2.8 2-2.8 3.7" />
        <circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none" />
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
      <template v-else-if="name === 'settings'">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </template>
      <template v-else-if="name === 'chevron'">
        <path d="m9 6 6 6-6 6" />
      </template>
      <template v-else-if="name === 'cart'">
        <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.5" fill="currentColor" stroke="none" />
        <path d="M3 4h2l2.5 11h9L21 7H7" />
      </template>
      <template v-else-if="name === 'photos'">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <path d="m4 16 4.5-4.5 3 3L15 11l5 5" />
      </template>
      <template v-else-if="name === 'mail'">
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="m4 8 8 6 8-6" />
      </template>
      <template v-else-if="name === 'download'">
        <path d="M12 4v10M8 10l4 4 4-4" />
        <path d="M4 18h16" />
      </template>
      <template v-else-if="name === 'calendar'">
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M8 4v4M16 4v4M4 11h16" />
      </template>
      <template v-else-if="name === 'pin'">
        <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.2" />
      </template>
      <template v-else-if="name === 'wallet'">
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
        <circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
      </template>
      <template v-else-if="name === 'chart'">
        <path d="M4 19h16" />
        <path d="M7 16v-5M12 16V8M17 16v-8" />
      </template>
      <template v-else-if="name === 'lock'">
        <rect x="6" y="11" width="12" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </template>
      <template v-else-if="name === 'shield'">
        <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
      </template>
      <template v-else-if="name === 'star'">
        <path d="m12 3 2.4 6.6H21l-5.2 4 2 6.4L12 16.8 6.2 20l2-6.4L3 9.6h6.6z" />
      </template>
      <template v-else-if="name === 'grid'">
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </template>
      <template v-else-if="name === 'list'">
        <path d="M8 7h12M8 12h12M8 17h12" />
        <circle cx="4.5" cy="7" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="17" r=".8" fill="currentColor" stroke="none" />
      </template>
      <template v-else-if="name === 'plus'">
        <path d="M12 5v14M5 12h14" />
      </template>
      <template v-else-if="name === 'trash'">
        <path d="M5 7h14M9 7V5h6v2M8 7l.8 12h6.4L16 7" />
      </template>
      <template v-else-if="name === 'pencil'">
        <path d="M4 20h4L19 9l-4-4L4 16z" />
        <path d="m13 7 4 4" />
      </template>
      <template v-else-if="name === 'phone'">
        <path d="M7 3h4l1 4-2 1.5a12 12 0 0 0 5.5 5.5L17 12l4 1v4a2 2 0 0 1-2 2A16 16 0 0 1 5 7a2 2 0 0 1 2-2z" />
      </template>
      <template v-else-if="name === 'sparkles'">
        <path d="M12 3v4M12 17v4M4.2 6.2l2.8 2.8M17 17l2.8 2.8M3 12h4M17 12h4M4.2 17.8 7 15M17 9l2.8-2.8" />
        <circle cx="12" cy="12" r="2.2" />
      </template>
      <template v-else-if="name === 'clock'">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </template>
    </svg>
    <template #fallback>
      <span :class="class" class="inline-block h-5 w-5 shrink-0" aria-hidden="true" />
    </template>
  </ClientOnly>
</template>
