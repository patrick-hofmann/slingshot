<script setup lang="ts">
import { ref, watch } from 'vue'
import { UButton, UIcon } from '@/components/ui'

const props = defineProps<{
  modelValue: string
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  save: []
}>()

const content = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  content.value = newValue
})

watch(content, (newValue) => {
  emit('update:modelValue', newValue)
})

function handleSave() {
  emit('save')
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Implementation Plan</h3>
      <UButton
        v-if="!readonly"
        size="sm"
        @click="handleSave"
      >
        <UIcon name="i-heroicons-check" class="h-4 w-4" />
        Save Plan
      </UButton>
    </div>

    <div class="flex-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <textarea
        v-model="content"
        :readonly="readonly"
        class="h-full w-full resize-none bg-white p-4 font-mono text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-white"
        :class="{ 'cursor-not-allowed opacity-60': readonly }"
        placeholder="# Implementation Plan

## Overview
Describe what this thread will accomplish...

## Steps
1. First, we will...
2. Then...
3. Finally...

## Acceptance Criteria
- [ ] Feature X works as expected
- [ ] All tests pass
- [ ] No regressions"
      />
    </div>

    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      Write your implementation plan in Markdown. This will be sent to Claude Code for execution.
    </p>
  </div>
</template>
