<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useThreadsStore } from '@/stores/threads'
import { UModal, UButton, UInput, USelect, UFormField, UAlert } from '@/components/ui'

const props = defineProps<{
  open: boolean
  projectId: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: []
}>()

const threadsStore = useThreadsStore()

const form = reactive({
  name: '',
  baseBranch: 'main'
})

const loading = ref(false)
const error = ref<string | null>(null)
const branches = ref<string[]>(['main', 'master', 'develop'])

async function fetchBranches() {
  try {
    branches.value = await window.slingshot.git.getBranches(props.projectId)
    if (branches.value.length > 0 && !branches.value.includes(form.baseBranch)) {
      form.baseBranch = branches.value[0]
    }
  } catch {
    // Keep default branches
  }
}

onMounted(() => {
  if (props.open) {
    fetchBranches()
  }
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    fetchBranches()
  }
})

async function handleSubmit() {
  if (!form.name) {
    error.value = 'Thread name is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    await threadsStore.createThread({
      projectId: props.projectId,
      name: form.name,
      baseBranch: form.baseBranch
    })
    resetForm()
    emit('created')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create thread'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.baseBranch = branches.value[0] || 'main'
  error.value = null
}

function handleClose() {
  resetForm()
  emit('update:open', false)
}

const branchOptions = branches.value.map(b => ({ label: b, value: b }))
</script>

<template>
  <UModal
    :open="props.open"
    @update:open="handleClose"
  >
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Create New Thread</h3>
    </template>

    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UAlert
          v-if="error"
          color="error"
          :title="error"
        />

        <UFormField label="Thread Name" required>
          <UInput
            v-model="form.name"
            placeholder="Fix authentication bug"
            autofocus
          />
        </UFormField>

        <UFormField label="Base Branch">
          <USelect
            v-model="form.baseBranch"
            :items="branches.map(b => ({ label: b, value: b }))"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click="handleClose"
        >
          Cancel
        </UButton>
        <UButton
          :loading="loading"
          @click="handleSubmit"
        >
          Create Thread
        </UButton>
      </div>
    </template>
  </UModal>
</template>
