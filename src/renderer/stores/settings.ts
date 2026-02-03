import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppSettings } from '../../preload/index'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSettings() {
    loading.value = true
    error.value = null
    try {
      settings.value = await window.slingshot.settings.get()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch settings'
    } finally {
      loading.value = false
    }
  }

  async function saveSettings(newSettings: AppSettings) {
    loading.value = true
    error.value = null
    try {
      settings.value = await window.slingshot.settings.save(newSettings)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save settings'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(partial: Partial<AppSettings>) {
    loading.value = true
    error.value = null
    try {
      settings.value = await window.slingshot.settings.update(partial)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update settings'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function resetSettings() {
    loading.value = true
    error.value = null
    try {
      settings.value = await window.slingshot.settings.reset()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to reset settings'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    settings,
    loading,
    error,
    fetchSettings,
    saveSettings,
    updateSettings,
    resetSettings
  }
})
