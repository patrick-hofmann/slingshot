import { registerProjectHandlers } from './project.ipc'
import { registerThreadHandlers } from './thread.ipc'
import { registerClaudeHandlers } from './claude.ipc'
import { registerGitHandlers } from './git.ipc'
import { registerSettingsHandlers } from './settings.ipc'
import { registerAzureDevOpsHandlers } from './azure-devops.ipc'

export function registerIpcHandlers() {
  registerProjectHandlers()
  registerThreadHandlers()
  registerClaudeHandlers()
  registerGitHandlers()
  registerSettingsHandlers()
  registerAzureDevOpsHandlers()
}
