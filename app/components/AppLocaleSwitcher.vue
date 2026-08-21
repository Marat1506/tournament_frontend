<script setup lang="ts">
import type { AppLocale } from '~/i18n/messages'

const { locale } = useI18n()
const { applyLocale } = useAppLocale()

const options: { code: AppLocale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'es', label: 'ES' },
]

async function pick(code: AppLocale) {
  if (code === locale.value) return
  await applyLocale(code)
}
</script>

<template>
  <div
    class="flex items-center rounded-full bg-white/10 p-0.5 text-xs font-semibold"
    role="group"
    :aria-label="locale === 'ru' ? 'Язык' : locale === 'es' ? 'Idioma' : 'Language'"
  >
    <button
      v-for="opt in options"
      :key="opt.code"
      type="button"
      class="min-h-11 min-w-11 rounded-full px-2 py-1 transition"
      :class="locale === opt.code ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-300 hover:text-white'"
      :aria-pressed="locale === opt.code"
      @click="pick(opt.code)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
