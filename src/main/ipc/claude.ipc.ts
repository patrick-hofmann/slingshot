import { ipcMain, BrowserWindow } from 'electron'
import * as dbService from '../services/database.service'
import { shotCycleService } from '../services/shot-cycle.service'
import { getMainWindow } from '../window'

export function registerClaudeHandlers() {
  // Runs
  ipcMain.handle('runs:list', async (_event, threadId: string) => {
    return dbService.listRuns(threadId)
  })

  ipcMain.handle('runs:get', async (_event, id: string) => {
    return dbService.getRun(id)
  })

  ipcMain.handle('runs:getEvents', async (_event, runId: string) => {
    return dbService.listRunEvents(runId)
  })

  ipcMain.handle('runs:start', async (_event, threadId: string, planId: string) => {
    // Get thread to find project path
    const thread = await dbService.getThread(threadId)
    if (!thread) {
      throw new Error('Thread not found')
    }

    const project = await dbService.getProject(thread.projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    // Create run
    const run = await dbService.createRun({
      threadId,
      planId
    })

    // Set up event forwarding to renderer
    const eventHandler = (data: { runId: string; event: any }) => {
      const mainWindow = getMainWindow()
      if (mainWindow) {
        mainWindow.webContents.send('runs:event', {
          runId: data.runId,
          event: {
            id: Date.now().toString(),
            runId: data.runId,
            eventType: data.event.type,
            timestamp: new Date(),
            data: data.event.data
          }
        })
      }
    }

    const completeHandler = async (data: { runId: string; success: boolean }) => {
      shotCycleService.removeListener('runEvent', eventHandler)
      shotCycleService.removeListener('runCompleted', completeHandler)

      // Refresh run data
      const updatedRun = await dbService.getRun(data.runId)
      const mainWindow = getMainWindow()
      if (mainWindow && updatedRun) {
        mainWindow.webContents.send('runs:completed', updatedRun)
      }
    }

    shotCycleService.on('runEvent', eventHandler)
    shotCycleService.on('runCompleted', completeHandler)

    // Start the shot cycle (async, don't await)
    shotCycleService.startCycle({
      threadId,
      planId,
      projectPath: project.localPath
    }).catch(async (error) => {
      await dbService.updateRun(run.id, {
        status: 'failed',
        errorMessage: error.message
      })
    })

    return run
  })

  ipcMain.handle('runs:cancel', async (_event, runId: string) => {
    shotCycleService.cancelCycle(runId)
    return dbService.updateRun(runId, { status: 'cancelled' })
  })
}
