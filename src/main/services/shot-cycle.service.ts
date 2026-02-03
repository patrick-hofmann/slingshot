import { EventEmitter } from 'events'
import * as dbService from './database.service'
import * as gitService from './git.service'
import { claudeCliService } from './claude-cli.service'

export interface ShotCycleOptions {
  threadId: string
  planId: string
  projectPath: string
}

export class ShotCycleService extends EventEmitter {
  private activeCycles: Map<string, boolean> = new Map()

  async startCycle(options: ShotCycleOptions): Promise<void> {
    const { threadId, planId, projectPath } = options

    // Get thread and plan
    const thread = await dbService.getThread(threadId)
    const plan = await dbService.getPlan(planId)

    if (!thread || !plan) {
      throw new Error('Thread or plan not found')
    }

    // Create checkpoint
    let checkpointCommit: string
    try {
      const status = await gitService.getStatus(projectPath)
      const hasChanges = status.modified.length > 0 ||
        status.added.length > 0 ||
        status.deleted.length > 0 ||
        status.untracked.length > 0

      if (hasChanges) {
        checkpointCommit = await gitService.createCheckpoint(projectPath)
      } else {
        checkpointCommit = await gitService.getHeadCommit(projectPath)
      }
    } catch {
      checkpointCommit = await gitService.getHeadCommit(projectPath)
    }

    // Create run record
    const run = await dbService.createRun({
      threadId,
      planId,
      checkpointCommit
    })

    this.activeCycles.set(run.id, true)

    // Update run status
    await dbService.updateRun(run.id, { status: 'running' })
    this.emit('runStarted', { runId: run.id, threadId })

    // Build prompt
    const prompt = this.buildPrompt(plan.content, thread.name)

    // Set up event handlers
    const eventHandler = async (data: { runId: string; event: any }) => {
      if (data.runId !== run.id) return

      // Save event to database
      const eventType = this.mapEventType(data.event.type)
      await dbService.createRunEvent({
        runId: run.id,
        eventType,
        data: data.event.data
      })

      this.emit('runEvent', data)
    }

    const completeHandler = async (data: { runId: string; exitCode: number; sessionId: string | null }) => {
      if (data.runId !== run.id) return

      claudeCliService.removeListener('event', eventHandler)
      claudeCliService.removeListener('complete', completeHandler)
      claudeCliService.removeListener('error', errorHandler)

      this.activeCycles.delete(run.id)

      if (data.exitCode === 0) {
        // Success
        const resultCommit = await gitService.getHeadCommit(projectPath)
        await dbService.updateRun(run.id, {
          status: 'success',
          resultCommit,
          claudeSessionId: data.sessionId ?? undefined
        })
        await dbService.updateThread(threadId, { status: 'completed' })
        this.emit('runCompleted', { runId: run.id, threadId, success: true })
      } else {
        // Failure
        await this.handleFailure(run.id, threadId, projectPath, checkpointCommit)
      }
    }

    const errorHandler = async (data: { runId: string; error: string }) => {
      if (data.runId !== run.id) return

      await dbService.updateRun(run.id, {
        status: 'failed',
        errorMessage: data.error
      })
      await this.handleFailure(run.id, threadId, projectPath, checkpointCommit)
    }

    claudeCliService.on('event', eventHandler)
    claudeCliService.on('complete', completeHandler)
    claudeCliService.on('error', errorHandler)

    // Execute Claude CLI
    try {
      await claudeCliService.executeRun({
        runId: run.id,
        projectPath,
        prompt
      })
    } catch (error) {
      await dbService.updateRun(run.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
      await this.handleFailure(run.id, threadId, projectPath, checkpointCommit)
    }
  }

  private buildPrompt(planContent: string, threadName: string): string {
    return `# Task: ${threadName}

## Implementation Plan

${planContent}

## Instructions

Please implement the plan above. Follow the steps carefully and ensure all acceptance criteria are met.
If you encounter any issues or need clarification, stop and explain the problem.

When you're done, provide a summary of what was accomplished.`
  }

  private mapEventType(type: string): 'assistant' | 'tool_use' | 'tool_result' | 'error' {
    switch (type) {
      case 'assistant': return 'assistant'
      case 'tool_use': return 'tool_use'
      case 'tool_result': return 'tool_result'
      default: return 'error'
    }
  }

  private async handleFailure(
    runId: string,
    threadId: string,
    projectPath: string,
    checkpointCommit: string
  ): Promise<void> {
    // Extract learnings from the run
    const events = await dbService.listRunEvents(runId)
    const learnings = this.extractLearnings(events)

    // Save learnings
    for (const learning of learnings) {
      await dbService.createLearning({
        threadId,
        runId,
        category: learning.category,
        content: learning.content
      })
    }

    // Reset to checkpoint
    try {
      await gitService.resetToCheckpoint(projectPath, checkpointCommit)
    } catch (error) {
      console.error('Failed to reset to checkpoint:', error)
    }

    // Update thread status
    await dbService.updateThread(threadId, { status: 'failed' })

    this.emit('runCompleted', { runId, threadId, success: false, learnings })
  }

  private extractLearnings(events: Array<{ eventType: string; data: Record<string, unknown> }>): Array<{
    category: 'error' | 'constraint' | 'insight'
    content: string
  }> {
    const learnings: Array<{ category: 'error' | 'constraint' | 'insight'; content: string }> = []

    for (const event of events) {
      if (event.eventType === 'error') {
        const text = String(event.data.text ?? event.data.message ?? '')
        if (text) {
          learnings.push({
            category: 'error',
            content: text
          })
        }
      }

      // Look for constraint violations in tool results
      if (event.eventType === 'tool_result') {
        const output = String(event.data.output ?? '')
        if (output.toLowerCase().includes('error') ||
            output.toLowerCase().includes('failed') ||
            output.toLowerCase().includes('permission denied')) {
          learnings.push({
            category: 'constraint',
            content: output.slice(0, 500)
          })
        }
      }
    }

    return learnings
  }

  cancelCycle(runId: string): void {
    if (this.activeCycles.has(runId)) {
      claudeCliService.cancelRun(runId)
      this.activeCycles.delete(runId)
      dbService.updateRun(runId, { status: 'cancelled' })
      this.emit('runCancelled', { runId })
    }
  }

  isRunning(runId: string): boolean {
    return this.activeCycles.has(runId)
  }
}

export const shotCycleService = new ShotCycleService()
