import { ipcMain, app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import * as dbService from '../services/database.service'
import * as gitService from '../services/git.service'

export function registerProjectHandlers() {
  ipcMain.handle('projects:list', async () => {
    return dbService.listProjects()
  })

  ipcMain.handle('projects:get', async (_event, id: string) => {
    return dbService.getProject(id)
  })

  ipcMain.handle('projects:create', async (_event, data: {
    name: string
    provider: 'github' | 'azure-devops'
    repoUrl: string
    localPath?: string
  }) => {
    // Determine local path
    let localPath = data.localPath
    if (!localPath) {
      const projectsDir = join(app.getPath('userData'), 'projects')
      if (!existsSync(projectsDir)) {
        mkdirSync(projectsDir, { recursive: true })
      }
      // Extract repo name from URL
      const repoName = data.repoUrl.split('/').pop()?.replace('.git', '') ?? data.name
      localPath = join(projectsDir, repoName)
    }

    // Create project in database
    const project = await dbService.createProject({
      name: data.name,
      provider: data.provider,
      repoUrl: data.repoUrl,
      localPath
    })

    return project
  })

  ipcMain.handle('projects:update', async (_event, id: string, data: {
    name?: string
    settings?: Record<string, unknown>
  }) => {
    return dbService.updateProject(id, data)
  })

  ipcMain.handle('projects:delete', async (_event, id: string) => {
    return dbService.deleteProject(id)
  })

  ipcMain.handle('projects:clone', async (_event, id: string) => {
    const project = await dbService.getProject(id)
    if (!project) {
      throw new Error('Project not found')
    }

    if (existsSync(project.localPath)) {
      throw new Error('Directory already exists')
    }

    // Clone repository
    await gitService.cloneRepository(project.repoUrl, project.localPath)

    return project
  })
}
