<script setup lang="ts">
import AppLayout from './components/layout/AppLayout.vue'
import UToast from './components/ui/UToast.vue'
</script>

<template>
  <AppLayout>
    <router-view />
  </AppLayout>
  <UToast />
</template>
