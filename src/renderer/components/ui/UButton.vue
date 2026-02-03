<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  variant?: 'solid' | 'soft' | 'ghost'
  color?: 'primary' | 'neutral' | 'error' | 'success' | 'warning'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  icon?: string
  loading?: boolean
  disabled?: boolean
  block?: boolean
  to?: string
}>(), {
  variant: 'solid',
  color: 'primary',
  size: 'md'
})

const emit = defineEmits<{
  click: [e: MouseEvent]
}>()

const router = useRouter()

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const sizes: Record<string, string> = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  }

  const variants: Record<string, Record<string, string>> = {
    solid: {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
      neutral: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
    },
    soft: {
      primary: 'bg-primary-100 text-primary-700 hover:bg-primary-200 focus:ring-primary-500 dark:bg-primary-900 dark:text-primary-300',
      neutral: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-300',
      error: 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900 dark:text-red-300',
      success: 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:ring-yellow-500 dark:bg-yellow-900 dark:text-yellow-300'
    },
    ghost: {
      primary: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:text-primary-400 dark:hover:bg-primary-900/20',
      neutral: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-400 dark:hover:bg-gray-800',
      error: 'text-red-600 hover:bg-red-50 focus:ring-red-500 dark:text-red-400',
      success: 'text-green-600 hover:bg-green-50 focus:ring-green-500 dark:text-green-400',
      warning: 'text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500 dark:text-yellow-400'
    }
  }

  return [
    base,
    sizes[props.size],
    variants[props.variant][props.color],
    props.block && 'w-full'
  ].filter(Boolean).join(' ')
})

function handleClick(e: MouseEvent) {
  if (props.to) {
    router.push(props.to)
  }
  emit('click', e)
}
</script>

<template>
  <button
    :class="classes"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <svg v-if="loading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
