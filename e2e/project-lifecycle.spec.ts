import { test, expect } from './electron'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { execSync } from 'child_process'

const TEST_PROJECT_NAME = 'E2E Test Project'

// Use TEST_PROJECT_PATH from .env.test.local if set, otherwise create temp repo
const useEnvPath = !!process.env.TEST_PROJECT_PATH

test.describe('Local Project Lifecycle', () => {
  let testProjectPath: string
  let shouldCleanup = false

  test.beforeAll(() => {
    if (useEnvPath) {
      testProjectPath = process.env.TEST_PROJECT_PATH!
      // Validate the path exists and is a git repo
      if (!existsSync(testProjectPath)) {
        throw new Error(`TEST_PROJECT_PATH does not exist: ${testProjectPath}`)
      }
      if (!existsSync(join(testProjectPath, '.git'))) {
        throw new Error(`TEST_PROJECT_PATH is not a git repository: ${testProjectPath}`)
      }
    } else {
      // Create a temporary git repository for testing
      testProjectPath = join(tmpdir(), `slingshot-e2e-test-${Date.now()}`)
      mkdirSync(testProjectPath, { recursive: true })
      execSync('git init', { cwd: testProjectPath })
      writeFileSync(join(testProjectPath, 'README.md'), '# Test Project')
      execSync('git add .', { cwd: testProjectPath })
      execSync('git commit -m "Initial commit"', { cwd: testProjectPath })
      shouldCleanup = true
    }
  })

  test.afterAll(() => {
    // Only clean up if we created a temp directory
    if (shouldCleanup && testProjectPath && existsSync(testProjectPath)) {
      rmSync(testProjectPath, { recursive: true, force: true })
    }
  })

  test('create and delete local project without removing directory', async ({ window }) => {
    // Precondition: Verify test directory exists
    expect(existsSync(testProjectPath)).toBe(true)
    expect(existsSync(join(testProjectPath, '.git'))).toBe(true)

    // Set up dialog handler once for all dialogs
    window.on('dialog', dialog => dialog.accept())

    // 1. Navigate to projects page and open create modal
    await window.waitForSelector('text=New Project', { timeout: 10000 })

    // Cleanup: Delete any existing test projects from previous runs
    const projectCardSelector = `[data-project-name="${TEST_PROJECT_NAME}"]`
    let existingProject = window.locator(projectCardSelector).first()
    while (await existingProject.isVisible().catch(() => false)) {
      await existingProject.click()
      await window.waitForSelector('text=Delete', { timeout: 5000 })
      await window.click('text=Delete')
      await window.waitForSelector('text=New Project', { timeout: 5000 })
      existingProject = window.locator(projectCardSelector).first()
    }

    await window.click('text=New Project')
    await expect(window.locator('text=Create New Project')).toBeVisible()

    // 2. Fill form for local project
    await window.fill('input[placeholder="My Project"]', TEST_PROJECT_NAME)
    await window.selectOption('select', 'local')
    await window.fill('input[placeholder="/path/to/repository"]', testProjectPath)

    // 3. Submit form
    await window.click('text=Create Project')

    // 4. Verify project appears in list (wait for toast to disappear first)
    await window.waitForTimeout(2000)
    const projectCard = window.locator(projectCardSelector)
    await expect(projectCard).toBeVisible({ timeout: 5000 })

    // 5. Open project and delete it
    await projectCard.click()
    await window.waitForSelector('text=Delete', { timeout: 5000 })

    // 6. Delete project (dialog handler already set up)
    await window.click('text=Delete')

    // 7. Verify redirect to projects list
    await expect(window.locator('text=New Project')).toBeVisible({ timeout: 5000 })

    // 8. Verify project no longer in list
    await expect(window.locator(projectCardSelector)).not.toBeVisible()

    // 9. CRITICAL: Verify directory still exists on disk
    expect(existsSync(testProjectPath)).toBe(true)
    expect(existsSync(join(testProjectPath, '.git'))).toBe(true)
  })
})
