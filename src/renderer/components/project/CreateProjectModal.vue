<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import { UModal, UButton, UInput, USelect, UFormField, UAlert } from '@/components/ui'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: []
}>()

const projectsStore = useProjectsStore()

const form = reactive({
  name: '',
  provider: 'github' as 'github' | 'azure-devops',
  repoUrl: '',
  localPath: ''
})

const loading = ref(false)
const error = ref<string | null>(null)

const providerOptions = [
  { label: 'GitHub', value: 'github' },
  { label: 'Azure DevOps', value: 'azure-devops' }
]

async function handleSubmit() {
  if (!form.name || !form.repoUrl) {
    error.value = 'Name and Repository URL are required'
    return
  }

  loading.value = true
  error.value = null

  try {
    await projectsStore.createProject({
      name: form.name,
      provider: form.provider,
      repoUrl: form.repoUrl,
      localPath: form.localPath || undefined
    })
    resetForm()
    emit('created')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create project'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.provider = 'github'
  form.repoUrl = ''
  form.localPath = ''
  error.value = null
}

function handleClose() {
  resetForm()
  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="props.open"
    @update:open="handleClose"
  >
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Create New Project</h3>
    </template>

    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UAlert
          v-if="error"
          color="error"
          :title="error"
        />

        <UFormField label="Project Name" required>
          <UInput
            v-model="form.name"
            placeholder="My Project"
            autofocus
          />
        </UFormField>

        <UFormField label="Provider">
          <USelect
            v-model="form.provider"
            :items="providerOptions"
          />
        </UFormField>

        <UFormField label="Repository URL" required>
          <UInput
            v-model="form.repoUrl"
            placeholder="https://github.com/user/repo"
          />
        </UFormField>

        <UFormField label="Local Path" hint="Optional. Leave empty to use default location.">
          <UInput
            v-model="form.localPath"
            placeholder="~/projects/my-project"
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
          Create Project
        </UButton>
      </div>
    </template>
  </UModal>
</template>
