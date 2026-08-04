<script setup lang="ts">
import type { CategoryFilterValues } from '~/composables/useCategoryFilters'

const props = defineProps<{
  modelValue: CategoryFilterValues
  open: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [CategoryFilterValues]
  'update:open': [boolean]
}>()

const { t } = useI18n()
const { genderOptions, beltOptions, ageGroupOptions, weightClassOptions } = useCategoryFilterOptions()

const local = reactive({ ...props.modelValue })

watch(() => props.modelValue, (v) => {
  Object.assign(local, v)
}, { deep: true })

function apply() {
  emit('update:modelValue', { ...local })
  emit('update:open', false)
}

function reset() {
  local.gender = ''
  local.belt = ''
  local.age_group = ''
  local.weight_class = ''
  apply()
}

function close() {
  emit('update:open', false)
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-end bg-black/60" @click.self="close">
    <div class="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-[#151b28] p-4 pb-8">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">{{ t('filters.title') }}</h2>
        <button class="text-sm text-gray-400" @click="close">{{ t('common.cancel') }}</button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-400">{{ t('filters.gender') }}</label>
          <select v-model="local.gender" class="input-field">
            <option v-for="o in genderOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-400">{{ t('filters.belt') }}</label>
          <select v-model="local.belt" class="input-field">
            <option v-for="o in beltOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-400">{{ t('filters.age') }}</label>
          <select v-model="local.age_group" class="input-field">
            <option v-for="o in ageGroupOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-400">{{ t('filters.weight') }}</label>
          <select v-model="local.weight_class" class="input-field">
            <option v-for="o in weightClassOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
      </div>

      <div class="mt-6 flex gap-3">
        <button class="btn-secondary flex-1" @click="reset">{{ t('filters.reset') }}</button>
        <button class="btn-primary-solid flex-1" @click="apply">{{ t('filters.apply') }}</button>
      </div>
    </div>
  </div>
</template>
