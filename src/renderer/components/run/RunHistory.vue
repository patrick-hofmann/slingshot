<script setup lang="ts">
import type { Run } from '../../../preload/index'
import { UCard, UBadge, UIcon } from '@/components/ui'

defineProps<{
  runs: Run[]
}>()

const emit = defineEmits<{
  select: [runId: string]
}>()

function getStatusIcon(status: Run['status']) {
  switch (status) {
    case 'pending': return 'i-heroicons-clock'
    case 'running': return 'i-heroicons-play'
    case 'success': return 'i-heroicons-check-circle'
    case 'failed': return 'i-heroicons-x-circle'
    case 'cancelled': return 'i-heroicons-stop'
  }
}

function getStatusColor(status: Run['status']) {
  switch (status) {
    case 'pending': return 'neutral'
    case 'running': return 'warning'
    case 'success': return 'success'
    case 'failed': return 'error'
    case 'cancelled': return 'neutral'
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
    <div v-if="runs.length === 0" class="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
      <UIcon name="i-heroicons-clock" class="mx-auto h-10 w-10 text-gray-400" />
      <h3 class="mt-3 text-sm font-medium text-gray-900 dark:text-white">No runs yet</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Start a run to begin executing your plan.
      </p>
    </div>

    <div v-else class="space-y-2">
      <UCard
        v-for="run in runs"
        :key="run.id"
        class="cursor-pointer transition-shadow hover:shadow-md"
        @click="emit('select', run.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full"
              :class="{
                'bg-gray-100 dark:bg-gray-800': run.status === 'pending' || run.status === 'cancelled',
                'bg-yellow-100 dark:bg-yellow-900': run.status === 'running',
                'bg-green-100 dark:bg-green-900': run.status === 'success',
                'bg-red-100 dark:bg-red-900': run.status === 'failed'
              }"
            >
              <UIcon :name="getStatusIcon(run.status)" class="h-4 w-4" />
            </div>
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">Run #{{ run.runNumber }}</h4>
              <p v-if="run.checkpointCommit" class="text-xs text-gray-500 dark:text-gray-400">
                Checkpoint: {{ run.checkpointCommit.slice(0, 7) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <UBadge :color="getStatusColor(run.status) as any" variant="subtle">
              {{ run.status }}
            </UBadge>
            <span class="text-xs text-gray-400">
              {{ formatDate(run.createdAt) }}
            </span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
