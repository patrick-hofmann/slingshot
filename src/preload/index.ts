import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

export interface SlingshotApi {
  // Projects
  projects: {
    list(): Promise<Project[]>
    get(id: string): Promise<Project | null>
    create(data: CreateProjectInput): Promise<Project>
    update(id: string, data: UpdateProjectInput): Promise<Project>
    delete(id: string): Promise<void>
    clone(id: string): Promise<void>
  }
  // Threads
  threads: {
    list(projectId: string): Promise<Thread[]>
    get(id: string): Promise<Thread | null>
    create(data: CreateThreadInput): Promise<Thread>
    update(id: string, data: UpdateThreadInput): Promise<Thread>
    delete(id: string): Promise<void>
  }
  // Plans
  plans: {
    list(threadId: string): Promise<Plan[]>
    get(id: string): Promise<Plan | null>
    create(data: CreatePlanInput): Promise<Plan>
  }
  // Runs
  runs: {
    list(threadId: string): Promise<Run[]>
    get(id: string): Promise<Run | null>
    start(threadId: string, planId: string): Promise<Run>
    cancel(runId: string): Promise<void>
    getEvents(runId: string): Promise<RunEvent[]>
    onEvent(callback: (event: RunStreamEvent) => void): () => void
  }
  // Learnings
  learnings: {
    list(threadId: string): Promise<Learning[]>
    create(data: CreateLearningInput): Promise<Learning>
  }
  // Git
  git: {
    getBranches(projectId: string): Promise<string[]>
    getCurrentBranch(projectId: string): Promise<string>
    createCheckpoint(projectId: string): Promise<string>
    resetToCheckpoint(projectId: string, commitSha: string): Promise<void>
    getStatus(projectId: string): Promise<GitStatus>
  }
  // Settings
  settings: {
    get(): Promise<AppSettings>
    save(settings: AppSettings): Promise<AppSettings>
    update(partial: Partial<AppSettings>): Promise<AppSettings>
    reset(): Promise<AppSettings>
  }
  // Azure DevOps
  azure: {
    isConfigured(): Promise<boolean>
    getWorkItem(id: number): Promise<WorkItem | null>
    searchWorkItems(project: string, query: string): Promise<WorkItem[]>
    updateWorkItemState(id: number, state: string): Promise<boolean>
    addComment(id: number, comment: string): Promise<boolean>
    parseUrl(url: string): Promise<number | null>
  }
}

// Types
export interface Project {
  id: string
  name: string
  provider: 'github' | 'azure-devops'
  repoUrl: string
  localPath: string
  settings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectInput {
  name: string
  provider: 'github' | 'azure-devops'
  repoUrl: string
  localPath?: string
}

export interface UpdateProjectInput {
  name?: string
  settings?: Record<string, unknown>
}

export interface Thread {
  id: string
  projectId: string
  name: string
  status: 'draft' | 'planning' | 'ready' | 'running' | 'completed' | 'failed'
  baseBranch: string
  workingBranch: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateThreadInput {
  projectId: string
  name: string
  baseBranch: string
}

export interface UpdateThreadInput {
  name?: string
  status?: Thread['status']
  workingBranch?: string
}

export interface Plan {
  id: string
  threadId: string
  version: number
  content: string
  source: 'user' | 'refined' | 'generated'
  parentPlanId: string | null
  createdAt: Date
}

export interface CreatePlanInput {
  threadId: string
  content: string
  source: Plan['source']
  parentPlanId?: string
}

export interface Run {
  id: string
  threadId: string
  planId: string
  runNumber: number
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  checkpointCommit: string | null
  resultCommit: string | null
  claudeSessionId: string | null
  errorMessage: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RunEvent {
  id: string
  runId: string
  eventType: 'assistant' | 'tool_use' | 'tool_result' | 'error'
  timestamp: Date
  data: Record<string, unknown>
}

export interface RunStreamEvent {
  runId: string
  event: RunEvent
}

export interface Learning {
  id: string
  threadId: string
  runId: string
  category: 'error' | 'constraint' | 'insight'
  content: string
  appliedToPlanId: string | null
  createdAt: Date
}

export interface CreateLearningInput {
  threadId: string
  runId: string
  category: Learning['category']
  content: string
}

export interface GitStatus {
  modified: string[]
  added: string[]
  deleted: string[]
  untracked: string[]
}

export interface WorkItem {
  id: number
  title: string
  state: string
  type: string
  description: string
  url: string
}

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

const api: SlingshotApi = {
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    get: (id) => ipcRenderer.invoke('projects:get', id),
    create: (data) => ipcRenderer.invoke('projects:create', data),
    update: (id, data) => ipcRenderer.invoke('projects:update', id, data),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
    clone: (id) => ipcRenderer.invoke('projects:clone', id)
  },
  threads: {
    list: (projectId) => ipcRenderer.invoke('threads:list', projectId),
    get: (id) => ipcRenderer.invoke('threads:get', id),
    create: (data) => ipcRenderer.invoke('threads:create', data),
    update: (id, data) => ipcRenderer.invoke('threads:update', id, data),
    delete: (id) => ipcRenderer.invoke('threads:delete', id)
  },
  plans: {
    list: (threadId) => ipcRenderer.invoke('plans:list', threadId),
    get: (id) => ipcRenderer.invoke('plans:get', id),
    create: (data) => ipcRenderer.invoke('plans:create', data)
  },
  runs: {
    list: (threadId) => ipcRenderer.invoke('runs:list', threadId),
    get: (id) => ipcRenderer.invoke('runs:get', id),
    start: (threadId, planId) => ipcRenderer.invoke('runs:start', threadId, planId),
    cancel: (runId) => ipcRenderer.invoke('runs:cancel', runId),
    getEvents: (runId) => ipcRenderer.invoke('runs:getEvents', runId),
    onEvent: (callback) => {
      const handler = (_event: IpcRendererEvent, data: RunStreamEvent) => callback(data)
      ipcRenderer.on('runs:event', handler)
      return () => ipcRenderer.removeListener('runs:event', handler)
    }
  },
  learnings: {
    list: (threadId) => ipcRenderer.invoke('learnings:list', threadId),
    create: (data) => ipcRenderer.invoke('learnings:create', data)
  },
  git: {
    getBranches: (projectId) => ipcRenderer.invoke('git:getBranches', projectId),
    getCurrentBranch: (projectId) => ipcRenderer.invoke('git:getCurrentBranch', projectId),
    createCheckpoint: (projectId) => ipcRenderer.invoke('git:createCheckpoint', projectId),
    resetToCheckpoint: (projectId, sha) => ipcRenderer.invoke('git:resetToCheckpoint', projectId, sha),
    getStatus: (projectId) => ipcRenderer.invoke('git:getStatus', projectId)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings) => ipcRenderer.invoke('settings:save', settings),
    update: (partial) => ipcRenderer.invoke('settings:update', partial),
    reset: () => ipcRenderer.invoke('settings:reset')
  },
  azure: {
    isConfigured: () => ipcRenderer.invoke('azure:isConfigured'),
    getWorkItem: (id) => ipcRenderer.invoke('azure:getWorkItem', id),
    searchWorkItems: (project, query) => ipcRenderer.invoke('azure:searchWorkItems', project, query),
    updateWorkItemState: (id, state) => ipcRenderer.invoke('azure:updateWorkItemState', id, state),
    addComment: (id, comment) => ipcRenderer.invoke('azure:addComment', id, comment),
    parseUrl: (url) => ipcRenderer.invoke('azure:parseUrl', url)
  }
}

contextBridge.exposeInMainWorld('slingshot', api)
