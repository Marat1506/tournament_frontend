<script setup lang="ts">
const { t } = useI18n()
const { toasts, remove } = useToast()

const styles: Record<string, string> = {
  success: 'bg-green-500/15 text-green-300 ring-green-500/30',
  error: 'bg-red-500/15 text-red-300 ring-red-500/30',
  info: 'bg-brand-600/15 text-brand-200 ring-brand-500/30',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-full max-w-lg items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ring-1 backdrop-blur-md"
          :class="styles[toast.type]"
          role="status"
        >
          <span class="min-w-0 flex-1 leading-snug">{{ toast.message }}</span>
          <button
            type="button"
            class="shrink-0 rounded-lg px-1.5 py-0.5 text-xs opacity-70 hover:opacity-100"
            :aria-label="t('common.close')"
            @click="remove(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
