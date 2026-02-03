import { test, expect } from './electron'

test.describe('Project Creation', () => {
  test('can open create project modal', async ({ window }) => {
    // Wait for app to load
    await window.waitForSelector('text=New Project', { timeout: 10000 })

    // Click new project button
    await window.click('text=New Project')

    // Modal should be visible
    await expect(window.locator('text=Create New Project')).toBeVisible()
  })

  test('browse button does not trigger form validation', async ({ window }) => {
    await window.waitForSelector('text=New Project', { timeout: 10000 })
    await window.click('text=New Project')

    // Select local provider
    await window.selectOption('select', 'local')

    // Click browse button
    await window.click('text=Browse')

    // Should NOT show validation error (the dialog will open but we can't interact with native dialogs)
    // The key assertion is that no error message appears
    const errorAlert = window.locator('[role="alert"]')
    await expect(errorAlert).not.toBeVisible({ timeout: 1000 })
  })

  test('validates required fields on submit', async ({ window }) => {
    await window.waitForSelector('text=New Project', { timeout: 10000 })
    await window.click('text=New Project')

    // Try to submit without filling form
    await window.click('text=Create Project')

    // Should show validation error
    await expect(window.locator('text=Project name is required')).toBeVisible()
  })
})
