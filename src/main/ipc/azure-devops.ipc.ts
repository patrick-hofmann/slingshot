import { ipcMain } from 'electron'
import {
  fetchWorkItem,
  searchWorkItems,
  updateWorkItemState,
  addWorkItemComment,
  parseWorkItemFromUrl,
  isAzureDevOpsConfigured
} from '../services/azure-devops.service'

export function registerAzureDevOpsHandlers() {
  ipcMain.handle('azure:isConfigured', async () => {
    return isAzureDevOpsConfigured()
  })

  ipcMain.handle('azure:getWorkItem', async (_event, workItemId: number) => {
    return fetchWorkItem(workItemId)
  })

  ipcMain.handle('azure:searchWorkItems', async (_event, project: string, query: string) => {
    return searchWorkItems(project, query)
  })

  ipcMain.handle('azure:updateWorkItemState', async (_event, workItemId: number, state: string) => {
    return updateWorkItemState(workItemId, state)
  })

  ipcMain.handle('azure:addComment', async (_event, workItemId: number, comment: string) => {
    return addWorkItemComment(workItemId, comment)
  })

  ipcMain.handle('azure:parseUrl', async (_event, url: string) => {
    return parseWorkItemFromUrl(url)
  })
}
