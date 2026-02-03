import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, CreateProjectInput, UpdateProjectInput } from '../../preload/index'
import { useToastStore } from './toast'

export const useProjectsStore = defineStore('projects', () => {
  const toastStore = useToastStore()
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const sortedProjects = computed(() =>
    [...projects.value].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  )

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      projects.value = await window.slingshot.projects.list()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch projects'
    } finally {
      loading.value = false
    }
  }

  async function fetchProject(id: string) {
    loading.value = true
    error.value = null
    try {
      currentProject.value = await window.slingshot.projects.get(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch project'
    } finally {
      loading.value = false
    }
  }

  async function createProject(data: CreateProjectInput) {
    loading.value = true
    error.value = null
    try {
      const project = await window.slingshot.projects.create(data)
      projects.value.push(project)
      toastStore.success('Project created', `${project.name} has been created successfully`)
      return project
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create project'
      error.value = msg
      toastStore.error('Failed to create project', msg)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateProject(id: string, data: UpdateProjectInput) {
    loading.value = true
    error.value = null
    try {
      const project = await window.slingshot.projects.update(id, data)
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = project
      }
      if (currentProject.value?.id === id) {
        currentProject.value = project
      }
      return project
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update project'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteProject(id: string) {
    loading.value = true
    error.value = null
    try {
      await window.slingshot.projects.delete(id)
      projects.value = projects.value.filter(p => p.id !== id)
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete project'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cloneProject(id: string) {
    loading.value = true
    error.value = null
    try {
      await window.slingshot.projects.clone(id)
      await fetchProject(id)
      toastStore.success('Repository cloned', 'The repository has been cloned successfully')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to clone project'
      error.value = msg
      toastStore.error('Failed to clone repository', msg)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    projects: sortedProjects,
    currentProject,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    cloneProject
  }
})
