<script setup lang="ts">
import { computed } from 'vue'
import type { Thread } from '../../../preload/index'
import { UCard, UBadge, UIcon } from '@/components/ui'

const props = defineProps<{
  thread: Thread
}>()

defineEmits<{
  click: []
}>()

const statusConfig = computed(() => {
  const configs: Record<Thread['status'], { color: string; icon: string }> = {
    draft: { color: 'neutral', icon: 'i-heroicons-pencil' },
    planning: { color: 'info', icon: 'i-heroicons-document-text' },
    ready: { color: 'success', icon: 'i-heroicons-check-circle' },
    running: { color: 'warning', icon: 'i-heroicons-play' },
    completed: { color: 'success', icon: 'i-heroicons-check-badge' },
    failed: { color: 'error', icon: 'i-heroicons-x-circle' }
  }
  return configs[props.thread.status]
})

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <UCard
    class="cursor-pointer transition-shadow hover:shadow-md"
    @click="$emit('click')"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full"
          :class="{
            'bg-gray-100 dark:bg-gray-800': thread.status === 'draft',
            'bg-blue-100 dark:bg-blue-900': thread.status === 'planning',
            'bg-green-100 dark:bg-green-900': thread.status === 'ready' || thread.status === 'completed',
            'bg-yellow-100 dark:bg-yellow-900': thread.status === 'running',
            'bg-red-100 dark:bg-red-900': thread.status === 'failed'
          }"
        >
          <UIcon :name="statusConfig.icon" class="h-4 w-4" />
        </div>
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white">{{ thread.name }}</h4>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Base: {{ thread.baseBranch }}
            <span v-if="thread.workingBranch"> &rarr; {{ thread.workingBranch }}</span>
          </p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <UBadge :color="statusConfig.color as any" variant="subtle">
          {{ thread.status }}
        </UBadge>
        <span class="text-xs text-gray-400 dark:text-gray-500">
          {{ formatDate(thread.updatedAt) }}
        </span>
      </div>
    </div>
  </UCard>
</template>
