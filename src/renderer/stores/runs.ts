import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import type { Run, RunEvent, Plan, Learning, CreatePlanInput, CreateLearningInput } from '../../preload/index'
import { useToastStore } from './toast'

export const useRunsStore = defineStore('runs', () => {
  const toastStore = useToastStore()
  const runs = ref<Run[]>([])
  const currentRun = ref<Run | null>(null)
  const runEvents = ref<RunEvent[]>([])
  const plans = ref<Plan[]>([])
  const learnings = ref<Learning[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null
  let unsubscribeCompleted: (() => void) | null = null

  async function fetchRuns(threadId: string) {
    loading.value = true
    error.value = null
    try {
      runs.value = await window.slingshot.runs.list(threadId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch runs'
    } finally {
      loading.value = false
    }
  }

  async function fetchRun(id: string) {
    loading.value = true
    error.value = null
    try {
      currentRun.value = await window.slingshot.runs.get(id)
      if (currentRun.value) {
        runEvents.value = await window.slingshot.runs.getEvents(id)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch run'
    } finally {
      loading.value = false
    }
  }

  async function startRun(threadId: string, planId: string) {
    loading.value = true
    error.value = null
    try {
      const run = await window.slingshot.runs.start(threadId, planId)
      runs.value.push(run)
      currentRun.value = run
      runEvents.value = []
      subscribeToEvents()
      toastStore.info('Run started', `Run #${run.runNumber}`)
      return run
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to start run'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancelRun(runId: string) {
    try {
      await window.slingshot.runs.cancel(runId)
      if (currentRun.value?.id === runId) {
        currentRun.value = { ...currentRun.value, status: 'cancelled' }
      }
      const index = runs.value.findIndex(r => r.id === runId)
      if (index !== -1) {
        runs.value[index] = { ...runs.value[index], status: 'cancelled' }
      }
      toastStore.warning('Run cancelled')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to cancel run'
      throw e
    }
  }

  function subscribeToEvents() {
    if (unsubscribe) {
      unsubscribe()
    }
    if (unsubscribeCompleted) {
      unsubscribeCompleted()
    }
    unsubscribe = window.slingshot.runs.onEvent((streamEvent) => {
      if (currentRun.value && streamEvent.runId === currentRun.value.id) {
        runEvents.value.push(streamEvent.event)
      }
    })
    unsubscribeCompleted = window.slingshot.runs.onCompleted((completedRun) => {
      if (currentRun.value?.id === completedRun.id) {
        currentRun.value = completedRun
      }
      const index = runs.value.findIndex(r => r.id === completedRun.id)
      if (index !== -1) {
        runs.value[index] = completedRun
      }
      if (completedRun.status === 'success') {
        toastStore.success('Run completed', `Run #${completedRun.runNumber} finished successfully`)
      } else if (completedRun.status === 'failed') {
        toastStore.error('Run failed', completedRun.errorMessage || 'Unknown error')
      }
    })
  }

  function unsubscribeFromEvents() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (unsubscribeCompleted) {
      unsubscribeCompleted()
      unsubscribeCompleted = null
    }
  }

  async function fetchPlans(threadId: string) {
    try {
      plans.value = await window.slingshot.plans.list(threadId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch plans'
    }
  }

  async function createPlan(data: CreatePlanInput) {
    try {
      const plan = await window.slingshot.plans.create(data)
      plans.value.push(plan)
      return plan
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create plan'
      throw e
    }
  }

  async function fetchLearnings(threadId: string) {
    try {
      learnings.value = await window.slingshot.learnings.list(threadId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch learnings'
    }
  }

  async function createLearning(data: CreateLearningInput) {
    try {
      const learning = await window.slingshot.learnings.create(data)
      learnings.value.push(learning)
      return learning
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create learning'
      throw e
    }
  }

  function clearRuns() {
    runs.value = []
    currentRun.value = null
    runEvents.value = []
    plans.value = []
    learnings.value = []
    unsubscribeFromEvents()
  }

  onUnmounted(() => {
    unsubscribeFromEvents()
  })

  return {
    runs,
    currentRun,
    runEvents,
    plans,
    learnings,
    loading,
    error,
    fetchRuns,
    fetchRun,
    startRun,
    cancelRun,
    fetchPlans,
    createPlan,
    fetchLearnings,
    createLearning,
    clearRuns,
    subscribeToEvents,
    unsubscribeFromEvents
  }
})
