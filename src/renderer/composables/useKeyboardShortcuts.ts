import { useMagicKeys, whenever } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'

export function useKeyboardShortcuts() {
  const route = useRoute()
  const uiStore = useUiStore()
  const keys = useMagicKeys()

  const isOnProjectsPage = computed(() => route.path === '/projects')
  const isOnProjectDetailPage = computed(() => /^\/projects\/[^/]+$/.test(route.path))
  const isOnThreadPage = computed(() => /^\/projects\/[^/]+\/threads\/[^/]+$/.test(route.path))

  // Cmd+, - Open Settings (global)
  whenever(keys['Meta+Comma'], () => {
    uiStore.openSettings()
  })

  // Cmd+N - New Project (on /projects)
  whenever(keys['Meta+n'], () => {
    if (isOnProjectsPage.value) {
      uiStore.openNewProject()
    }
  })

  // Cmd+T - New Thread (on /projects/:id)
  whenever(keys['Meta+t'], () => {
    if (isOnProjectDetailPage.value) {
      uiStore.openNewThread()
    }
  })

  // Cmd+Enter - Start Run (on thread page)
  whenever(keys['Meta+Enter'], () => {
    if (isOnThreadPage.value) {
      uiStore.requestStartRun()
    }
  })

  // Cmd+. - Cancel Run (on thread page)
  whenever(keys['Meta+Period'], () => {
    if (isOnThreadPage.value) {
      uiStore.requestCancelRun()
    }
  })
}
