<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { computed } from 'vue'
import { UButton, UIcon } from '@/components/ui'

const route = useRoute()
const projectsStore = useProjectsStore()

const currentProjectId = computed(() => route.params.projectId as string | undefined)

const navigation = computed(() => [
  {
    label: 'Projects',
    icon: 'i-heroicons-folder',
    to: '/projects',
    active: route.name === 'projects'
  }
])
</script>

<template>
  <aside class="drag-region flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex h-12 items-center px-4">
      <span class="no-drag text-lg font-bold text-primary-600 dark:text-primary-400">Slingshot</span>
    </div>

    <nav class="no-drag flex-1 space-y-1 px-2 py-2">
      <UButton
        v-for="item in navigation"
        :key="item.label"
        :to="item.to"
        :variant="item.active ? 'soft' : 'ghost'"
        color="neutral"
        block
        class="justify-start"
      >
        <UIcon :name="item.icon" class="h-4 w-4" />
        {{ item.label }}
      </UButton>

      <template v-if="projectsStore.projects.length > 0">
        <div class="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
          Recent Projects
        </div>
        <UButton
          v-for="project in projectsStore.projects.slice(0, 5)"
          :key="project.id"
          :to="`/projects/${project.id}`"
          :variant="currentProjectId === project.id ? 'soft' : 'ghost'"
          color="neutral"
          block
          class="justify-start truncate"
        >
          <UIcon name="i-heroicons-code-bracket" class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ project.name }}</span>
        </UButton>
      </template>
    </nav>

    <div class="no-drag border-t border-gray-200 p-2 dark:border-gray-800">
      <UButton
        variant="ghost"
        color="neutral"
        block
        class="justify-start"
      >
        <UIcon name="i-heroicons-cog-6-tooth" class="h-4 w-4" />
        Settings
      </UButton>
    </div>
  </aside>
</template>
