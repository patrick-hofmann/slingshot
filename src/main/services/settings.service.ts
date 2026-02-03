import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

export interface AppSettings {
  claude: {
    model: 'claude-sonnet-4-20250514' | 'claude-opus-4-20250514' | 'claude-3-5-haiku-20241022'
    maxTurns: number
    budgetTokens: number | null
    autoApprove: boolean
  }
  git: {
    autoCommit: boolean
    commitPrefix: string
  }
  ui: {
    theme: 'light' | 'dark' | 'system'
    sidebarCollapsed: boolean
  }
  azureDevOps: {
    organization: string | null
    pat: string | null
  }
}

const DEFAULT_SETTINGS: AppSettings = {
  claude: {
    model: 'claude-sonnet-4-20250514',
    maxTurns: 50,
    budgetTokens: null,
    autoApprove: false
  },
  git: {
    autoCommit: true,
    commitPrefix: '[slingshot]'
  },
  ui: {
    theme: 'system',
    sidebarCollapsed: false
  },
  azureDevOps: {
    organization: null,
    pat: null
  }
}

let cachedSettings: AppSettings | null = null

function getSettingsPath(): string {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'settings.json')
}

export function loadSettings(): AppSettings {
  if (cachedSettings) {
    return cachedSettings
  }

  const settingsPath = getSettingsPath()

  if (!existsSync(settingsPath)) {
    cachedSettings = { ...DEFAULT_SETTINGS }
    saveSettings(cachedSettings)
    return cachedSettings
  }

  try {
    const data = readFileSync(settingsPath, 'utf-8')
    const parsed = JSON.parse(data)
    // Merge with defaults to ensure all fields exist
    cachedSettings = deepMerge(DEFAULT_SETTINGS, parsed)
    return cachedSettings
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS }
    return cachedSettings
  }
}

export function saveSettings(settings: AppSettings): void {
  const settingsPath = getSettingsPath()
  const dir = join(app.getPath('userData'))

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
  cachedSettings = settings
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = loadSettings()
  const updated = deepMerge(current, partial)
  saveSettings(updated)
  return updated
}

export function resetSettings(): AppSettings {
  const newSettings: AppSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
  cachedSettings = newSettings
  saveSettings(newSettings)
  return newSettings
}

function deepMerge(target: AppSettings, source: Partial<AppSettings>): AppSettings {
  const result = JSON.parse(JSON.stringify(target)) as AppSettings

  if (source.claude) {
    result.claude = { ...result.claude, ...source.claude }
  }
  if (source.git) {
    result.git = { ...result.git, ...source.git }
  }
  if (source.ui) {
    result.ui = { ...result.ui, ...source.ui }
  }
  if (source.azureDevOps) {
    result.azureDevOps = { ...result.azureDevOps, ...source.azureDevOps }
  }

  return result
}
