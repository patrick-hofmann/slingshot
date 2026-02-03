<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { UColorModeButton, UButton, UIcon } from '@/components/ui'
import SettingsModal from '@/components/settings/SettingsModal.vue'

const route = useRoute()
const showSettings = ref(false)

const title = computed(() => {
  if (route.name === 'projects') return 'Projects'
  if (route.name === 'project') return 'Threads'
  if (route.name === 'thread') return 'Thread'
  return 'Slingshot'
})
</script>

<template>
  <header class="drag-region flex h-12 shrink-0 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
    <div class="w-20" />
    <h1 class="no-drag flex-1 text-center text-sm font-medium text-gray-900 dark:text-white">
      {{ title }}
    </h1>
    <div class="w-20 flex justify-end gap-1">
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        class="no-drag"
        @click="showSettings = true"
      >
        <UIcon name="i-heroicons-cog-6-tooth" class="h-4 w-4" />
      </UButton>
      <UColorModeButton class="no-drag" />
    </div>
  </header>

  <SettingsModal v-model:open="showSettings" />
</template>
