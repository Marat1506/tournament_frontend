<script setup lang="ts">
import type { LegalSection } from '~/composables/useLegalContent'

defineProps<{
  title: string
  updated: string
  intro?: string
  sections: LegalSection[]
}>()

const { t } = useI18n()
</script>

<template>
  <div>
    <AppPageHeader :title="title">
      <template #left>
        <NuxtLink to="/" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <AppIcon name="back" class="h-5 w-5" />
        </NuxtLink>
      </template>
    </AppPageHeader>

    <div class="page-container">
      <article class="card legal-prose p-5">
        <p v-if="intro" class="intro">{{ intro }}</p>
        <p class="updated">{{ t('legal.updated', { date: updated }) }}</p>

        <section v-for="(section, index) in sections" :key="index">
          <h2>{{ section.title }}</h2>
          <p v-for="(paragraph, pIndex) in section.paragraphs" :key="pIndex">
            {{ paragraph }}
          </p>
          <ul v-if="section.list?.length">
            <li v-for="(item, lIndex) in section.list" :key="lIndex">{{ item }}</li>
          </ul>
        </section>
      </article>

      <AppSiteFooter class="mt-6" />
    </div>
  </div>
</template>
