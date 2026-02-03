<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { UModal, UButton, UInput, USelect, UFormField, UTabs, UIcon } from '@/components/ui'
import type { AppSettings } from '@/types'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const settingsStore = useSettingsStore()

const localSettings = ref<AppSettings | null>(null)
const activeTab = ref('claude')
const saving = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

watch(() => props.open, async (newValue) => {
  if (newValue) {
    await settingsStore.fetchSettings()
    if (settingsStore.settings) {
      localSettings.value = JSON.parse(JSON.stringify(settingsStore.settings))
    }
  }
})

const modelOptions = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recommended)' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4 (Most capable)' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fastest)' }
]

const themeOptions = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const tabs = [
  { key: 'claude', label: 'Claude', icon: 'i-heroicons-cpu-chip' },
  { key: 'git', label: 'Git', icon: 'i-heroicons-code-bracket' },
  { key: 'azure', label: 'Azure DevOps', icon: 'i-heroicons-cloud' },
  { key: 'ui', label: 'Appearance', icon: 'i-heroicons-paint-brush' }
]

async function save() {
  if (!localSettings.value) return
  saving.value = true
  try {
    await settingsStore.saveSettings(localSettings.value)
    isOpen.value = false
  } finally {
    saving.value = false
  }
}

async function reset() {
  await settingsStore.resetSettings()
  if (settingsStore.settings) {
    localSettings.value = JSON.parse(JSON.stringify(settingsStore.settings))
  }
}

function close() {
  isOpen.value = false
}
</script>

<template>
  <UModal v-model:open="isOpen" title="Settings" size="lg">
    <template v-if="localSettings">
      <UTabs v-model="activeTab" :items="tabs" class="mb-4">
        <template #content="{ item }">
          <div class="space-y-4 py-4">
            <!-- Claude Settings -->
            <template v-if="item?.key === 'claude'">
              <UFormField label="Model">
                <USelect
                  v-model="localSettings.claude.model"
                  :options="modelOptions"
                />
              </UFormField>

              <UFormField label="Max Turns" hint="Maximum number of agentic turns per run">
                <UInput
                  v-model.number="localSettings.claude.maxTurns"
                  type="number"
                  :min="1"
                  :max="200"
                />
              </UFormField>

              <UFormField label="Budget (Tokens)" hint="Maximum tokens to use per run (leave empty for unlimited)">
                <UInput
                  v-model.number="localSettings.claude.budgetTokens"
                  type="number"
                  :min="1000"
                  placeholder="Unlimited"
                />
              </UFormField>

              <UFormField>
                <label class="flex items-center gap-2">
                  <input
                    v-model="localSettings.claude.autoApprove"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Auto-approve tool calls</span>
                </label>
              </UFormField>
            </template>

            <!-- Git Settings -->
            <template v-else-if="item?.key === 'git'">
              <UFormField label="Commit Prefix" hint="Prefix for auto-generated commits">
                <UInput v-model="localSettings.git.commitPrefix" />
              </UFormField>

              <UFormField>
                <label class="flex items-center gap-2">
                  <input
                    v-model="localSettings.git.autoCommit"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Auto-commit checkpoints</span>
                </label>
              </UFormField>
            </template>

            <!-- Azure DevOps Settings -->
            <template v-else-if="item?.key === 'azure'">
              <UFormField label="Organization" hint="Your Azure DevOps organization name">
                <UInput
                  v-model="localSettings.azureDevOps.organization"
                  placeholder="my-organization"
                />
              </UFormField>

              <UFormField label="Personal Access Token" hint="PAT with Work Items read/write permissions">
                <UInput
                  v-model="localSettings.azureDevOps.pat"
                  type="password"
                  placeholder="••••••••••••"
                />
              </UFormField>

              <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <div class="flex items-start gap-3">
                  <UIcon name="i-heroicons-information-circle" class="h-5 w-5 text-blue-500" />
                  <div class="text-sm text-blue-700 dark:text-blue-300">
                    <p class="font-medium">How to create a PAT:</p>
                    <ol class="mt-1 list-decimal pl-4">
                      <li>Go to Azure DevOps → User Settings → Personal Access Tokens</li>
                      <li>Click "New Token"</li>
                      <li>Select scopes: Work Items (Read & Write)</li>
                      <li>Copy the generated token here</li>
                    </ol>
                  </div>
                </div>
              </div>
            </template>

            <!-- UI Settings -->
            <template v-else-if="item?.key === 'ui'">
              <UFormField label="Theme">
                <USelect
                  v-model="localSettings.ui.theme"
                  :options="themeOptions"
                />
              </UFormField>

              <UFormField>
                <label class="flex items-center gap-2">
                  <input
                    v-model="localSettings.ui.sidebarCollapsed"
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700 dark:text-gray-300">Collapse sidebar by default</span>
                </label>
              </UFormField>
            </template>
          </div>
        </template>
      </UTabs>
    </template>

    <div v-else class="flex items-center justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="h-6 w-6 animate-spin text-gray-400" />
    </div>

    <template #footer>
      <div class="flex justify-between">
        <UButton variant="ghost" color="error" @click="reset">
          Reset to Defaults
        </UButton>
        <div class="flex gap-2">
          <UButton variant="outline" @click="close">Cancel</UButton>
          <UButton :loading="saving" @click="save">Save Settings</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
