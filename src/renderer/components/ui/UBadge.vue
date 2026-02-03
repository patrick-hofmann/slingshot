<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  color?: 'primary' | 'neutral' | 'error' | 'success' | 'warning' | 'info'
  variant?: 'solid' | 'subtle'
  size?: 'xs' | 'sm' | 'md'
}>(), {
  color: 'primary',
  variant: 'subtle',
  size: 'sm'
})

const classes = computed(() => {
  const base = 'inline-flex items-center font-medium rounded-full'

  const sizes: Record<string, string> = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  }

  const variants: Record<string, Record<string, string>> = {
    solid: {
      primary: 'bg-primary-600 text-white',
      neutral: 'bg-gray-600 text-white',
      error: 'bg-red-600 text-white',
      success: 'bg-green-600 text-white',
      warning: 'bg-yellow-600 text-white',
      info: 'bg-blue-600 text-white'
    },
    subtle: {
      primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
      neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    }
  }

  return [base, sizes[props.size], variants[props.variant][props.color]].join(' ')
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
