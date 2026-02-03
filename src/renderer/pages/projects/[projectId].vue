<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useThreadsStore } from '@/stores/threads'
import { useUiStore } from '@/stores/ui'
import ThreadCard from '@/components/thread/ThreadCard.vue'
import CreateThreadModal from '@/components/thread/CreateThreadModal.vue'
import { UButton, UIcon } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const threadsStore = useThreadsStore()
const uiStore = useUiStore()

const projectId = route.params.projectId as string

onMounted(async () => {
  await projectsStore.fetchProject(projectId)
  await threadsStore.fetchThreads(projectId)
})

watch(() => route.params.projectId, async (newId) => {
  if (newId && typeof newId === 'string') {
    await projectsStore.fetchProject(newId)
    await threadsStore.fetchThreads(newId)
  }
})

function openThread(id: string) {
  router.push(`/projects/${projectId}/threads/${id}`)
}

function goBack() {
  router.push('/projects')
}

async function handleDelete() {
  if (!projectsStore.currentProject) return

  const confirmed = window.confirm(`Delete project "${projectsStore.currentProject.name}"? This will only remove it from the app, not delete any files.`)
  if (!confirmed) return

  await projectsStore.deleteProject(projectId)
  router.push('/projects')
}
</script>

<template>
  <div>
    <div class="mb-6">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        class="mb-4"
        @click="goBack"
      >
        <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
        Back to Projects
      </UButton>

      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ projectsStore.currentProject?.name ?? 'Loading...' }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ projectsStore.currentProject?.repoUrl }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            variant="ghost"
            color="error"
            @click="handleDelete"
          >
            <UIcon name="i-heroicons-trash" class="h-4 w-4" />
            Delete
          </UButton>
          <UButton @click="uiStore.openNewThread()">
            <UIcon name="i-heroicons-plus" class="h-4 w-4" />
            New Thread
          </UButton>
        </div>
      </div>
    </div>

    <div v-if="threadsStore.loading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="threadsStore.threads.length === 0" class="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
      <UIcon name="i-heroicons-chat-bubble-left-right" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No threads yet</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Start a new thread to work on a task.</p>
      <UButton class="mt-4" @click="uiStore.openNewThread()">
        <UIcon name="i-heroicons-plus" class="h-4 w-4" />
        New Thread
      </UButton>
    </div>

    <div v-else class="space-y-3">
      <ThreadCard
        v-for="thread in threadsStore.threads"
        :key="thread.id"
        :thread="thread"
        @click="openThread(thread.id)"
      />
    </div>

    <CreateThreadModal
      v-if="projectsStore.currentProject"
      v-model:open="uiStore.showNewThread"
      :project-id="projectId"
      @created="uiStore.closeNewThread()"
    />
  </div>
</template>
