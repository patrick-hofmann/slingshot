import { defineConfig } from '@playwright/test'
import { config } from 'dotenv'

// Load .env.test.local for test configuration
config({ path: '.env.test.local' })

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    trace: 'on-first-retry',
  },
})
