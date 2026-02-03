<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useThreadsStore } from '@/stores/threads'
import { useRunsStore } from '@/stores/runs'
import { useUiStore } from '@/stores/ui'
import PlanEditor from '@/components/plan/PlanEditor.vue'
import RunMonitor from '@/components/run/RunMonitor.vue'
import LearningsPanel from '@/components/thread/LearningsPanel.vue'
import RunHistory from '@/components/run/RunHistory.vue'
import { UButton, UBadge, UTabs, UIcon } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const threadsStore = useThreadsStore()
const runsStore = useRunsStore()
const uiStore = useUiStore()

const projectId = route.params.projectId as string
const threadId = route.params.threadId as string

const activeTab = ref('plan')
const planContent = ref('')

const latestPlan = computed(() => {
  if (runsStore.plans.length === 0) return null
  return runsStore.plans.reduce((latest, plan) =>
    plan.version > latest.version ? plan : latest
  , runsStore.plans[0])
})

const canStartRun = computed(() => {
  if (!threadsStore.currentThread) return false
  if (!latestPlan.value && !planContent.value) return false
  const status = threadsStore.currentThread.status
  return status === 'ready' || status === 'draft' || status === 'failed'
})

const isRunning = computed(() => {
  return runsStore.currentRun?.status === 'running'
})

onMounted(async () => {
  await projectsStore.fetchProject(projectId)
  await threadsStore.fetchThread(threadId)
  await runsStore.fetchRuns(threadId)
  await runsStore.fetchPlans(threadId)
  await runsStore.fetchLearnings(threadId)

  if (latestPlan.value) {
    planContent.value = latestPlan.value.content
  }
})

watch(() => route.params.threadId, async (newId) => {
  if (newId && typeof newId === 'string') {
    await threadsStore.fetchThread(newId)
    await runsStore.fetchRuns(newId)
    await runsStore.fetchPlans(newId)
    await runsStore.fetchLearnings(newId)

    if (latestPlan.value) {
      planContent.value = latestPlan.value.content
    }
  }
})

// Handle keyboard shortcut actions
watch(() => uiStore.runActionRequested, (action) => {
  if (action === 'start' && canStartRun.value) {
    startRun()
    uiStore.clearRunAction()
  } else if (action === 'cancel' && isRunning.value) {
    cancelRun()
    uiStore.clearRunAction()
  } else if (action) {
    uiStore.clearRunAction()
  }
})

function goBack() {
  router.push(`/projects/${projectId}`)
}

async function savePlan() {
  await runsStore.createPlan({
    threadId,
    content: planContent.value,
    source: latestPlan.value ? 'refined' : 'user',
    parentPlanId: latestPlan.value?.id
  })
  await threadsStore.updateThread(threadId, { status: 'ready' })
}

async function startRun() {
  if (!latestPlan.value) {
    await savePlan()
  }

  const planToUse = latestPlan.value
  if (!planToUse) return

  await threadsStore.updateThread(threadId, { status: 'running' })
  await runsStore.startRun(threadId, planToUse.id)
  activeTab.value = 'monitor'
}

async function cancelRun() {
  if (runsStore.currentRun) {
    await runsStore.cancelRun(runsStore.currentRun.id)
    await threadsStore.updateThread(threadId, { status: 'failed' })
  }
}

const statusBadgeColor = computed(() => {
  const status = threadsStore.currentThread?.status
  switch (status) {
    case 'draft': return 'neutral'
    case 'planning': return 'info'
    case 'ready': return 'success'
    case 'running': return 'warning'
    case 'completed': return 'success'
    case 'failed': return 'error'
    default: return 'neutral'
  }
})

const tabs = [
  { key: 'plan', label: 'Plan', icon: 'i-heroicons-document-text' },
  { key: 'monitor', label: 'Monitor', icon: 'i-heroicons-computer-desktop' },
  { key: 'learnings', label: 'Learnings', icon: 'i-heroicons-light-bulb' },
  { key: 'history', label: 'History', icon: 'i-heroicons-clock' }
]
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-4 shrink-0">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        class="mb-4"
        @click="goBack"
      >
        <UIcon name="i-heroicons-arrow-left" class="h-4 w-4" />
        Back to Threads
      </UButton>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ threadsStore.currentThread?.name ?? 'Loading...' }}
          </h2>
          <UBadge
            v-if="threadsStore.currentThread"
            :color="statusBadgeColor"
            variant="subtle"
          >
            {{ threadsStore.currentThread.status }}
          </UBadge>
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="canStartRun"
            color="primary"
            @click="startRun"
          >
            <UIcon name="i-heroicons-play" class="h-4 w-4" />
            Start Run
          </UButton>
          <UButton
            v-if="isRunning"
            color="error"
            @click="cancelRun"
          >
            <UIcon name="i-heroicons-stop" class="h-4 w-4" />
            Cancel
          </UButton>
        </div>
      </div>
    </div>

    <UTabs
      v-model="activeTab"
      :items="tabs"
      class="flex-1 overflow-hidden"
    >
      <template #content="{ item }">
        <div class="h-full overflow-auto pt-4">
          <PlanEditor
            v-if="item?.key === 'plan'"
            v-model="planContent"
            :readonly="isRunning"
            @save="savePlan"
          />
          <RunMonitor
            v-else-if="item?.key === 'monitor'"
            :run="runsStore.currentRun"
            :events="runsStore.runEvents"
          />
          <LearningsPanel
            v-else-if="item?.key === 'learnings'"
            :learnings="runsStore.learnings"
          />
          <RunHistory
            v-else-if="item?.key === 'history'"
            :runs="runsStore.runs"
            @select="runsStore.fetchRun($event)"
          />
        </div>
      </template>
    </UTabs>
  </div>
</template>
