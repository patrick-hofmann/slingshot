import { _electron as electron } from 'playwright'
import { test as base, type ElectronApplication, type Page } from '@playwright/test'

type ElectronFixtures = {
  electronApp: ElectronApplication
  window: Page
}

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({ args: ['.'] })

    // Mock the dialog.showOpenDialog to prevent native dialogs from blocking tests
    // The evaluate callback receives the electron module as its argument
    try {
      await app.evaluate(async ({ ipcMain }) => {
        // Remove the existing handler and add a mock that returns null
        ipcMain.removeHandler('dialog:openFolder')
        ipcMain.handle('dialog:openFolder', async () => null)
      })
    } catch (e) {
      // If mocking fails, continue anyway - test might still work
      console.warn('Failed to mock dialog:', e)
    }

    await use(app)
    await app.close()
  },
  window: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow()
    await use(window)
  }
})

export { expect } from '@playwright/test'
