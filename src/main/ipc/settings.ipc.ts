import { ipcMain, nativeTheme } from 'electron'
import { loadSettings, saveSettings, updateSettings, resetSettings, type AppSettings } from '../services/settings.service'

export function registerSettingsHandlers() {
  ipcMain.handle('settings:get', async () => {
    return loadSettings()
  })

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    saveSettings(settings)
    applyTheme(settings.ui.theme)
    return settings
  })

  ipcMain.handle('settings:update', async (_event, partial: Partial<AppSettings>) => {
    const updated = updateSettings(partial)
    if (partial.ui?.theme) {
      applyTheme(updated.ui.theme)
    }
    return updated
  })

  ipcMain.handle('settings:reset', async () => {
    const settings = resetSettings()
    applyTheme(settings.ui.theme)
    return settings
  })

  // Apply theme on startup
  const settings = loadSettings()
  applyTheme(settings.ui.theme)
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  nativeTheme.themeSource = theme
}
