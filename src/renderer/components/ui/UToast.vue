<script setup lang="ts">
import { computed } from 'vue'
import { useToastStore } from '@/stores/toast'
import UIcon from './UIcon.vue'

const toastStore = useToastStore()

const iconMap = {
  success: 'i-heroicons-check-circle',
  error: 'i-heroicons-x-circle',
  warning: 'i-heroicons-exclamation-triangle',
  info: 'i-heroicons-information-circle'
}

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
}

const iconColorMap = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="['flex items-start gap-3 rounded-lg border p-4 shadow-lg', colorMap[toast.type]]"
        >
          <UIcon
            :name="iconMap[toast.type]"
            :class="['h-5 w-5 shrink-0', iconColorMap[toast.type]]"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium">{{ toast.title }}</p>
            <p v-if="toast.message" class="mt-1 text-sm opacity-80">{{ toast.message }}</p>
          </div>
          <button
            class="shrink-0 opacity-50 hover:opacity-100"
            @click="toastStore.remove(toast.id)"
          >
            <UIcon name="i-heroicons-x-mark" class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
