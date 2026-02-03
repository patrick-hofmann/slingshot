<script setup lang="ts">
import { watch, computed } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md'
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'max-w-sm'
    case 'md': return 'max-w-lg'
    case 'lg': return 'max-w-2xl'
    case 'xl': return 'max-w-4xl'
    default: return 'max-w-lg'
  }
})

function close() {
  emit('update:open', false)
}

// Close on escape
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="close" />
        <div :class="['relative z-10 w-full rounded-lg bg-white shadow-xl dark:bg-gray-800', sizeClasses]">
          <div class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <slot name="header">
              <h3 v-if="title" class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h3>
            </slot>
          </div>
          <div class="max-h-[60vh] overflow-y-auto px-6 py-4">
            <slot />
            <slot name="body" />
          </div>
          <div class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
