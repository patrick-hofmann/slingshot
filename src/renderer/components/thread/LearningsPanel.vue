<script setup lang="ts">
import type { Learning } from '../../../preload/index'
import { UCard, UBadge, UIcon } from '@/components/ui'

defineProps<{
  learnings: Learning[]
}>()

function getCategoryIcon(category: Learning['category']) {
  switch (category) {
    case 'error': return 'i-heroicons-exclamation-triangle'
    case 'constraint': return 'i-heroicons-shield-exclamation'
    case 'insight': return 'i-heroicons-light-bulb'
  }
}

function getCategoryColor(category: Learning['category']) {
  switch (category) {
    case 'error': return 'error'
    case 'constraint': return 'warning'
    case 'insight': return 'info'
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('de-DE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div>
    <div v-if="learnings.length === 0" class="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
      <UIcon name="i-heroicons-light-bulb" class="mx-auto h-10 w-10 text-gray-400" />
      <h3 class="mt-3 text-sm font-medium text-gray-900 dark:text-white">No learnings yet</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Learnings are extracted from failed runs to improve future attempts.
      </p>
    </div>

    <div v-else class="space-y-3">
      <UCard v-for="learning in learnings" :key="learning.id">
        <div class="flex items-start gap-3">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            :class="{
              'bg-red-100 dark:bg-red-900': learning.category === 'error',
              'bg-yellow-100 dark:bg-yellow-900': learning.category === 'constraint',
              'bg-blue-100 dark:bg-blue-900': learning.category === 'insight'
            }"
          >
            <UIcon :name="getCategoryIcon(learning.category)" class="h-4 w-4" />
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <UBadge :color="getCategoryColor(learning.category) as any" variant="subtle" size="xs">
                {{ learning.category }}
              </UBadge>
              <span class="text-xs text-gray-400">{{ formatDate(learning.createdAt) }}</span>
            </div>
            <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {{ learning.content }}
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
