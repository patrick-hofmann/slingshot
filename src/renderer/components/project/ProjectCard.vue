<script setup lang="ts">
import type { Project } from '../../../preload/index'
import { UCard, UIcon } from '@/components/ui'

defineProps<{
  project: Project
}>()

defineEmits<{
  click: []
}>()

function getProviderIcon(provider: string) {
  return provider === 'github' ? 'i-heroicons-code-bracket' : 'i-heroicons-cloud'
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <UCard
    class="cursor-pointer transition-shadow hover:shadow-md"
    :data-testid="`project-card-${project.id}`"
    :data-project-name="project.name"
    @click="$emit('click')"
  >
    <div class="flex items-start gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
        <UIcon :name="getProviderIcon(project.provider)" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate font-medium text-gray-900 dark:text-white">
          {{ project.name }}
        </h3>
        <p class="truncate text-sm text-gray-500 dark:text-gray-400">
          {{ project.repoUrl }}
        </p>
        <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Updated {{ formatDate(project.updatedAt) }}
        </p>
      </div>
    </div>
  </UCard>
</template>
