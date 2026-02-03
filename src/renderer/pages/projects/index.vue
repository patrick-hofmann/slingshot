<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import ProjectCard from '@/components/project/ProjectCard.vue'
import CreateProjectModal from '@/components/project/CreateProjectModal.vue'
import { UButton, UIcon } from '@/components/ui'

const router = useRouter()
const projectsStore = useProjectsStore()
const showCreateModal = ref(false)

onMounted(() => {
  projectsStore.fetchProjects()
})

function openProject(id: string) {
  router.push(`/projects/${id}`)
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Projects</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage your project repositories</p>
      </div>
      <UButton @click="showCreateModal = true">
        <UIcon name="i-heroicons-plus" class="h-4 w-4" />
        New Project
      </UButton>
    </div>

    <div v-if="projectsStore.loading" class="flex items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="projectsStore.projects.length === 0" class="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
      <UIcon name="i-heroicons-folder" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No projects yet</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
      <UButton class="mt-4" @click="showCreateModal = true">
        <UIcon name="i-heroicons-plus" class="h-4 w-4" />
        New Project
      </UButton>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCard
        v-for="project in projectsStore.projects"
        :key="project.id"
        :project="project"
        @click="openProject(project.id)"
      />
    </div>

    <CreateProjectModal
      v-model:open="showCreateModal"
      @created="showCreateModal = false"
    />
  </div>
</template>
