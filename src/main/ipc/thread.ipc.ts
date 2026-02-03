import { ipcMain } from 'electron'
import * as dbService from '../services/database.service'

export function registerThreadHandlers() {
  ipcMain.handle('threads:list', async (_event, projectId: string) => {
    return dbService.listThreads(projectId)
  })

  ipcMain.handle('threads:get', async (_event, id: string) => {
    return dbService.getThread(id)
  })

  ipcMain.handle('threads:create', async (_event, data: {
    projectId: string
    name: string
    baseBranch: string
  }) => {
    return dbService.createThread(data)
  })

  ipcMain.handle('threads:update', async (_event, id: string, data: {
    name?: string
    status?: 'draft' | 'planning' | 'ready' | 'running' | 'completed' | 'failed'
    workingBranch?: string
  }) => {
    return dbService.updateThread(id, data)
  })

  ipcMain.handle('threads:delete', async (_event, id: string) => {
    return dbService.deleteThread(id)
  })

  // Plans
  ipcMain.handle('plans:list', async (_event, threadId: string) => {
    return dbService.listPlans(threadId)
  })

  ipcMain.handle('plans:get', async (_event, id: string) => {
    return dbService.getPlan(id)
  })

  ipcMain.handle('plans:create', async (_event, data: {
    threadId: string
    content: string
    source: 'user' | 'refined' | 'generated'
    parentPlanId?: string
  }) => {
    return dbService.createPlan(data)
  })

  // Learnings
  ipcMain.handle('learnings:list', async (_event, threadId: string) => {
    return dbService.listLearnings(threadId)
  })

  ipcMain.handle('learnings:create', async (_event, data: {
    threadId: string
    runId: string
    category: 'error' | 'constraint' | 'insight'
    content: string
  }) => {
    return dbService.createLearning(data)
  })
}
