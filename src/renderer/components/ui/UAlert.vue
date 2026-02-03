<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  color?: 'error' | 'warning' | 'success' | 'info'
  title?: string
  icon?: string
}>(), {
  color: 'info'
})

const classes = computed(() => {
  const colors: Record<string, string> = {
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
  }
  return colors[props.color]
})
</script>

<template>
  <div :class="['rounded-lg border p-4', classes]">
    <div class="flex items-start gap-3">
      <div class="flex-1">
        <h3 v-if="title" class="font-medium">{{ title }}</h3>
        <slot />
      </div>
    </div>
  </div>
</template>
