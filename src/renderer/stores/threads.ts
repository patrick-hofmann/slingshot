import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Thread, CreateThreadInput, UpdateThreadInput } from '../../preload/index'

export const useThreadsStore = defineStore('threads', () => {
  const threads = ref<Thread[]>([])
  const currentThread = ref<Thread | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchThreads(projectId: string) {
    loading.value = true
    error.value = null
    try {
      threads.value = await window.slingshot.threads.list(projectId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch threads'
    } finally {
      loading.value = false
    }
  }

  async function fetchThread(id: string) {
    loading.value = true
    error.value = null
    try {
      currentThread.value = await window.slingshot.threads.get(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch thread'
    } finally {
      loading.value = false
    }
  }

  async function createThread(data: CreateThreadInput) {
    loading.value = true
    error.value = null
    try {
      const thread = await window.slingshot.threads.create(data)
      threads.value.push(thread)
      return thread
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create thread'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateThread(id: string, data: UpdateThreadInput) {
    loading.value = true
    error.value = null
    try {
      const thread = await window.slingshot.threads.update(id, data)
      const index = threads.value.findIndex(t => t.id === id)
      if (index !== -1) {
        threads.value[index] = thread
      }
      if (currentThread.value?.id === id) {
        currentThread.value = thread
      }
      return thread
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update thread'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteThread(id: string) {
    loading.value = true
    error.value = null
    try {
      await window.slingshot.threads.delete(id)
      threads.value = threads.value.filter(t => t.id !== id)
      if (currentThread.value?.id === id) {
        currentThread.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete thread'
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearThreads() {
    threads.value = []
    currentThread.value = null
  }

  return {
    threads,
    currentThread,
    loading,
    error,
    fetchThreads,
    fetchThread,
    createThread,
    updateThread,
    deleteThread,
    clearThreads
  }
})
