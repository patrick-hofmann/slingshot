import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { loadSettings } from './settings.service'

export interface ClaudeEvent {
  type: 'assistant' | 'tool_use' | 'tool_result' | 'error' | 'result'
  data: Record<string, unknown>
}

export interface RunOptions {
  runId: string
  projectPath: string
  prompt: string
  sessionId?: string
  model?: string
  maxTurns?: number
}

export class ClaudeCliService extends EventEmitter {
  private activeProcesses: Map<string, ChildProcess> = new Map()

  async executeRun(options: RunOptions): Promise<string | null> {
    const settings = loadSettings()

    const args = [
      '--print', 'jsonl',
      '--output-format', 'stream-json',
      '--model', options.model ?? settings.claude.model,
      '--max-turns', String(options.maxTurns ?? settings.claude.maxTurns),
      '-p', options.prompt
    ]

    if (options.sessionId) {
      args.push('--resume', options.sessionId)
    }

    if (settings.claude.autoApprove) {
      args.push('--dangerously-skip-permissions')
    }

    const proc = spawn('claude', args, {
      cwd: options.projectPath,
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    this.activeProcesses.set(options.runId, proc)

    let sessionId: string | null = null
    let buffer = ''

    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          const event = JSON.parse(line)
          const parsedEvent = this.parseEvent(event)

          if (parsedEvent) {
            this.emit('event', {
              runId: options.runId,
              event: parsedEvent
            })
          }

          // Extract session ID from result
          if (event.type === 'result' && event.session_id) {
            sessionId = event.session_id
          }
        } catch (e) {
          // Non-JSON output - treat as assistant message
          this.emit('event', {
            runId: options.runId,
            event: {
              type: 'assistant',
              data: { text: line }
            }
          })
        }
      }
    })

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      this.emit('event', {
        runId: options.runId,
        event: {
          type: 'error',
          data: { text }
        }
      })
    })

    return new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        this.activeProcesses.delete(options.runId)

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer)
            const parsedEvent = this.parseEvent(event)
            if (parsedEvent) {
              this.emit('event', { runId: options.runId, event: parsedEvent })
            }
            if (event.type === 'result' && event.session_id) {
              sessionId = event.session_id
            }
          } catch {
            // Ignore
          }
        }

        this.emit('complete', {
          runId: options.runId,
          exitCode: code,
          sessionId
        })

        if (code === 0) {
          resolve(sessionId)
        } else {
          reject(new Error(`Claude CLI exited with code ${code}`))
        }
      })

      proc.on('error', (err) => {
        this.activeProcesses.delete(options.runId)
        this.emit('error', {
          runId: options.runId,
          error: err.message
        })
        reject(err)
      })
    })
  }

  private parseEvent(raw: Record<string, unknown>): ClaudeEvent | null {
    const type = raw.type as string

    switch (type) {
      case 'assistant':
        return {
          type: 'assistant',
          data: {
            text: raw.message ?? raw.content ?? ''
          }
        }

      case 'tool_use':
        return {
          type: 'tool_use',
          data: {
            name: raw.name ?? raw.tool ?? 'unknown',
            input: raw.input ?? raw.parameters ?? {}
          }
        }

      case 'tool_result':
        return {
          type: 'tool_result',
          data: {
            name: raw.name ?? raw.tool ?? 'unknown',
            output: raw.output ?? raw.result ?? ''
          }
        }

      case 'error':
        return {
          type: 'error',
          data: {
            text: raw.message ?? raw.error ?? 'Unknown error'
          }
        }

      case 'result':
        return {
          type: 'result',
          data: {
            sessionId: raw.session_id,
            cost: raw.cost,
            duration: raw.duration
          }
        }

      default:
        // Unknown event type - return as-is
        if (raw.content || raw.message || raw.text) {
          return {
            type: 'assistant',
            data: {
              text: raw.content ?? raw.message ?? raw.text ?? ''
            }
          }
        }
        return null
    }
  }

  cancelRun(runId: string): boolean {
    const proc = this.activeProcesses.get(runId)
    if (proc) {
      proc.kill('SIGINT')
      this.activeProcesses.delete(runId)
      return true
    }
    return false
  }

  isRunning(runId: string): boolean {
    return this.activeProcesses.has(runId)
  }

  getActiveRuns(): string[] {
    return Array.from(this.activeProcesses.keys())
  }
}

export const claudeCliService = new ClaudeCliService()
