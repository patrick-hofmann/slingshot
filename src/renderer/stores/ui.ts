import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const showSettings = ref(false)
  const showNewProject = ref(false)
  const showNewThread = ref(false)

  // Event emitters for actions that need to be handled by page components
  const runActionRequested = ref<'start' | 'cancel' | null>(null)

  function openSettings() {
    showSettings.value = true
  }

  function closeSettings() {
    showSettings.value = false
  }

  function openNewProject() {
    showNewProject.value = true
  }

  function closeNewProject() {
    showNewProject.value = false
  }

  function openNewThread() {
    showNewThread.value = true
  }

  function closeNewThread() {
    showNewThread.value = false
  }

  function requestStartRun() {
    runActionRequested.value = 'start'
  }

  function requestCancelRun() {
    runActionRequested.value = 'cancel'
  }

  function clearRunAction() {
    runActionRequested.value = null
  }

  return {
    showSettings,
    showNewProject,
    showNewThread,
    runActionRequested,
    openSettings,
    closeSettings,
    openNewProject,
    closeNewProject,
    openNewThread,
    closeNewThread,
    requestStartRun,
    requestCancelRun,
    clearRunAction
  }
})
