<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Run, RunEvent } from '../../../preload/index'
import { UIcon, UAlert } from '@/components/ui'

const props = defineProps<{
  run: Run | null
  events: RunEvent[]
}>()

const outputRef = ref<HTMLDivElement | null>(null)
const autoScroll = ref(true)

watch(() => props.events.length, async () => {
  if (autoScroll.value) {
    await nextTick()
    if (outputRef.value) {
      outputRef.value.scrollTop = outputRef.value.scrollHeight
    }
  }
})

const isRunning = computed(() => props.run?.status === 'running')

function getEventIcon(type: RunEvent['eventType']) {
  switch (type) {
    case 'assistant': return 'i-heroicons-chat-bubble-left'
    case 'tool_use': return 'i-heroicons-wrench'
    case 'tool_result': return 'i-heroicons-check-circle'
    case 'error': return 'i-heroicons-exclamation-triangle'
  }
}

function getEventColor(type: RunEvent['eventType']) {
  switch (type) {
    case 'assistant': return 'text-blue-500'
    case 'tool_use': return 'text-purple-500'
    case 'tool_result': return 'text-green-500'
    case 'error': return 'text-red-500'
  }
}

function formatEventData(data: Record<string, unknown>): string {
  if (data.text) return String(data.text)
  if (data.name) return `${data.name}: ${JSON.stringify(data.input ?? data.output, null, 2)}`
  return JSON.stringify(data, null, 2)
}

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Run Output</h3>
        <span v-if="run" class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          :class="{
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': isRunning,
            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': run.status === 'success',
            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': run.status === 'failed' || run.status === 'cancelled'
          }">
          {{ run.status }}
        </span>
      </div>
      <label class="flex items-center gap-2 text-sm text-gray-500">
        <input v-model="autoScroll" type="checkbox" class="rounded" />
        Auto-scroll
      </label>
    </div>

    <div
      v-if="!run"
      class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700"
    >
      <div class="text-center">
        <UIcon name="i-heroicons-computer-desktop" class="mx-auto h-10 w-10 text-gray-400" />
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Start a run to see the output here
        </p>
      </div>
    </div>

    <div
      v-else
      ref="outputRef"
      class="flex-1 overflow-auto rounded-lg border border-gray-200 bg-gray-900 p-4 font-mono text-sm dark:border-gray-700"
    >
      <div v-if="events.length === 0 && isRunning" class="flex items-center gap-2 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="h-4 w-4 animate-spin" />
        Waiting for output...
      </div>

      <div v-for="event in events" :key="event.id" class="mb-3 last:mb-0">
        <div class="flex items-start gap-2">
          <UIcon :name="getEventIcon(event.eventType)" :class="['h-4 w-4 mt-0.5 shrink-0', getEventColor(event.eventType)]" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span class="uppercase">{{ event.eventType }}</span>
              <span>{{ formatTime(event.timestamp) }}</span>
            </div>
            <pre class="mt-1 whitespace-pre-wrap break-words text-gray-300">{{ formatEventData(event.data) }}</pre>
          </div>
        </div>
      </div>

      <div v-if="isRunning" class="mt-2 flex items-center gap-2 text-green-400">
        <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
        Running...
      </div>
    </div>

    <div v-if="run?.errorMessage" class="mt-3">
      <UAlert
        color="error"
        :title="run.errorMessage"
      />
    </div>
  </div>
</template>
