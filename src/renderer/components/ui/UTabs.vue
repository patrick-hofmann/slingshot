<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  items: Array<{ key: string; label: string; icon?: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeItem = computed(() =>
  props.items.find(item => item.key === props.modelValue)
)
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="item in items"
        :key="item.key"
        :class="[
          'px-4 py-2 text-sm font-medium transition-colors',
          modelValue === item.key
            ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        ]"
        @click="emit('update:modelValue', item.key)"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="flex-1 overflow-hidden">
      <slot name="content" :item="activeItem" />
    </div>
  </div>
</template>
