<script setup lang="ts">
defineProps<{
  imageUrl?: string
  alt?: string
}>()

const { t } = useI18n()

const colors = [
  { id: 'black', hex: '#1c1c1e', fold: '#2a2a2c', shade: '#0e0e10' },
  { id: 'white', hex: '#f4f4f5', fold: '#e4e4e7', shade: '#d4d4d8' },
  { id: 'navy', hex: '#1e3a5f', fold: '#2c4d78', shade: '#12263f' },
] as const

const colorId = ref<(typeof colors)[number]['id']>('black')
const color = computed(() => colors.find(c => c.id === colorId.value) || colors[0])
const printOnLight = computed(() => colorId.value === 'white')
</script>

<template>
  <div>
    <div
      class="relative overflow-hidden rounded-2xl"
      :style="{ background: 'radial-gradient(ellipse at 50% 30%, #1f2937 0%, #0b0f17 72%)' }"
    >
      <svg
        viewBox="0 0 400 460"
        class="mx-auto h-auto w-full max-w-[340px] drop-shadow-[0_28px_40px_rgba(0,0,0,0.55)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="shirtBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" :stop-color="color.fold" />
            <stop offset="42%" :stop-color="color.hex" />
            <stop offset="100%" :stop-color="color.shade" />
          </linearGradient>
          <linearGradient id="shirtSleeve" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" :stop-color="color.fold" />
            <stop offset="100%" :stop-color="color.shade" />
          </linearGradient>
          <radialGradient id="shirtShine" cx="38%" cy="28%" r="55%">
            <stop offset="0%" stop-color="#fff" :stop-opacity="printOnLight ? 0.35 : 0.12" />
            <stop offset="100%" stop-color="#fff" stop-opacity="0" />
          </radialGradient>
          <filter id="shirtSoft" x="-8%" y="-8%" width="116%" height="116%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
          </filter>
        </defs>

        <ellipse cx="200" cy="428" rx="108" ry="10" fill="#000" opacity="0.35" />

        <path
          fill="url(#shirtSleeve)"
          d="M92 78 L28 118 L8 168 L78 198 L96 132 Z"
        />
        <path
          fill="url(#shirtSleeve)"
          d="M308 78 L372 118 L392 168 L322 198 L304 132 Z"
        />

        <path
          fill="url(#shirtBody)"
          d="M128 52
             C140 92 260 92 272 52
             L308 78 L304 132 L322 198
             L322 400 C322 414 308 424 292 424
             L108 424 C92 424 78 414 78 400
             L78 198 L96 132 L92 78 Z"
        />
        <path fill="url(#shirtShine)" d="M128 52 C140 92 260 92 272 52 L308 78 L304 132 L322 210 L78 210 L96 132 L92 78 Z" />

        <path
          fill="none"
          :stroke="printOnLight ? '#c4c4c8' : '#000'"
          stroke-opacity="0.28"
          stroke-width="1.4"
          d="M128 52 C140 90 260 90 272 52"
        />
        <path
          :fill="printOnLight ? '#ececef' : color.shade"
          d="M168 58 C176 86 224 86 232 58 C214 74 186 74 168 58 Z"
        />
        <path
          fill="none"
          :stroke="printOnLight ? '#bbb' : '#000'"
          stroke-opacity="0.25"
          stroke-width="1"
          d="M108 424 L292 424"
        />
      </svg>

      <div
        class="absolute left-1/2 top-[31%] w-[34%] -translate-x-1/2 overflow-hidden rounded-[3px] shadow-[0_8px_18px_rgba(0,0,0,0.28)]"
        :class="printOnLight ? 'ring-1 ring-black/10' : 'ring-1 ring-white/10'"
        style="transform: translateX(-50%) perspective(900px) rotateX(7deg)"
      >
        <div class="relative aspect-[4/5] bg-white">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="alt || t('shop.mockupAlt')"
            class="h-full w-full object-cover"
            :class="printOnLight ? 'mix-blend-multiply' : 'contrast-[1.05]'"
          >
          <div
            v-else
            class="flex h-full flex-col items-center justify-center gap-1 bg-zinc-200 px-2 text-center"
          >
            <span class="text-[11px] font-medium text-zinc-500">{{ t('shop.mockupPlaceholder') }}</span>
            <span class="text-[9px] leading-tight text-zinc-400">{{ t('shop.mockupPlaceholderHint') }}</span>
          </div>
          <div
            class="pointer-events-none absolute inset-0"
            :style="{
              background: printOnLight
                ? 'linear-gradient(160deg, rgba(255,255,255,0.28), transparent 42%, rgba(0,0,0,0.08))'
                : 'linear-gradient(160deg, rgba(255,255,255,0.14), transparent 40%, rgba(0,0,0,0.28))',
              mixBlendMode: 'multiply',
            }"
          />
        </div>
      </div>
    </div>

    <div class="mt-4 flex justify-center gap-3">
      <button
        v-for="c in colors"
        :key="c.id"
        type="button"
        class="flex flex-col items-center gap-1.5"
        :aria-label="t(`shop.color.${c.id}`)"
        @click="colorId = c.id"
      >
        <span
          class="h-8 w-8 rounded-full ring-2 transition"
          :class="colorId === c.id ? 'ring-brand-400 ring-offset-2 ring-offset-[#151b28]' : 'ring-white/20'"
          :style="{ backgroundColor: c.hex }"
        />
        <span class="text-[10px] text-gray-400">{{ t(`shop.color.${c.id}`) }}</span>
      </button>
    </div>
    <p class="mt-2 text-center text-xs text-gray-500">{{ t('shop.mockupHint') }}</p>
  </div>
</template>
