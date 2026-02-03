import { ipcMain } from 'electron'
import { existsSync } from 'fs'
import * as dbService from '../services/database.service'
import * as gitService from '../services/git.service'

export function registerGitHandlers() {
  ipcMain.handle('git:getBranches', async (_event, projectId: string) => {
    const project = await dbService.getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    if (!existsSync(project.localPath)) {
      return ['main', 'master']
    }

    try {
      return gitService.getBranches(project.localPath)
    } catch {
      return ['main', 'master']
    }
  })

  ipcMain.handle('git:getCurrentBranch', async (_event, projectId: string) => {
    const project = await dbService.getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    if (!existsSync(project.localPath)) {
      throw new Error('Repository not cloned')
    }

    return gitService.getCurrentBranch(project.localPath)
  })

  ipcMain.handle('git:createCheckpoint', async (_event, projectId: string) => {
    const project = await dbService.getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    if (!existsSync(project.localPath)) {
      throw new Error('Repository not cloned')
    }

    return gitService.createCheckpoint(project.localPath)
  })

  ipcMain.handle('git:resetToCheckpoint', async (_event, projectId: string, commitSha: string) => {
    const project = await dbService.getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    if (!existsSync(project.localPath)) {
      throw new Error('Repository not cloned')
    }

    return gitService.resetToCheckpoint(project.localPath, commitSha)
  })

  ipcMain.handle('git:getStatus', async (_event, projectId: string) => {
    const project = await dbService.getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    if (!existsSync(project.localPath)) {
      throw new Error('Repository not cloned')
    }

    return gitService.getStatus(project.localPath)
  })
}
