<script setup lang="ts">
import AppLayout from './components/layout/AppLayout.vue'
import UToast from './components/ui/UToast.vue'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'

useKeyboardShortcuts()
</script>

<template>
  <AppLayout>
    <router-view />
  </AppLayout>
  <UToast />
</template>
