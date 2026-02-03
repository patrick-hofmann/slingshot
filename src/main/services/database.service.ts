import { eq, desc, and } from 'drizzle-orm'
import { v4 as uuid } from 'uuid'
import { getDatabase } from '../database/connection'
import * as schema from '../database/schema'

// Projects
export async function listProjects() {
  const db = getDatabase()
  return db.select().from(schema.projects).orderBy(desc(schema.projects.updatedAt))
}

export async function getProject(id: string) {
  const db = getDatabase()
  const results = await db.select().from(schema.projects).where(eq(schema.projects.id, id))
  return results[0] ?? null
}

export async function createProject(data: {
  name: string
  provider: 'github' | 'azure-devops'
  repoUrl: string
  localPath: string
  settings?: Record<string, unknown>
}) {
  const db = getDatabase()
  const now = new Date()
  const project = {
    id: uuid(),
    name: data.name,
    provider: data.provider,
    repoUrl: data.repoUrl,
    localPath: data.localPath,
    settings: data.settings ?? {},
    createdAt: now,
    updatedAt: now
  }
  await db.insert(schema.projects).values(project)
  return project
}

export async function updateProject(id: string, data: {
  name?: string
  settings?: Record<string, unknown>
}) {
  const db = getDatabase()
  const now = new Date()
  await db.update(schema.projects)
    .set({ ...data, updatedAt: now })
    .where(eq(schema.projects.id, id))
  return getProject(id)
}

export async function deleteProject(id: string) {
  const db = getDatabase()
  await db.delete(schema.projects).where(eq(schema.projects.id, id))
}

// Threads
export async function listThreads(projectId: string) {
  const db = getDatabase()
  return db.select().from(schema.threads)
    .where(eq(schema.threads.projectId, projectId))
    .orderBy(desc(schema.threads.updatedAt))
}

export async function getThread(id: string) {
  const db = getDatabase()
  const results = await db.select().from(schema.threads).where(eq(schema.threads.id, id))
  return results[0] ?? null
}

export async function createThread(data: {
  projectId: string
  name: string
  baseBranch: string
}) {
  const db = getDatabase()
  const now = new Date()
  const thread = {
    id: uuid(),
    projectId: data.projectId,
    name: data.name,
    status: 'draft' as const,
    baseBranch: data.baseBranch,
    workingBranch: null,
    createdAt: now,
    updatedAt: now
  }
  await db.insert(schema.threads).values(thread)
  return thread
}

export async function updateThread(id: string, data: {
  name?: string
  status?: 'draft' | 'planning' | 'ready' | 'running' | 'completed' | 'failed'
  workingBranch?: string
}) {
  const db = getDatabase()
  const now = new Date()
  await db.update(schema.threads)
    .set({ ...data, updatedAt: now })
    .where(eq(schema.threads.id, id))
  return getThread(id)
}

export async function deleteThread(id: string) {
  const db = getDatabase()
  await db.delete(schema.threads).where(eq(schema.threads.id, id))
}

// Plans
export async function listPlans(threadId: string) {
  const db = getDatabase()
  return db.select().from(schema.plans)
    .where(eq(schema.plans.threadId, threadId))
    .orderBy(desc(schema.plans.version))
}

export async function getPlan(id: string) {
  const db = getDatabase()
  const results = await db.select().from(schema.plans).where(eq(schema.plans.id, id))
  return results[0] ?? null
}

export async function createPlan(data: {
  threadId: string
  content: string
  source: 'user' | 'refined' | 'generated'
  parentPlanId?: string
}) {
  const db = getDatabase()

  // Get next version number
  const existingPlans = await listPlans(data.threadId)
  const version = existingPlans.length > 0
    ? Math.max(...existingPlans.map(p => p.version)) + 1
    : 1

  const plan = {
    id: uuid(),
    threadId: data.threadId,
    version,
    content: data.content,
    source: data.source,
    parentPlanId: data.parentPlanId ?? null,
    createdAt: new Date()
  }
  await db.insert(schema.plans).values(plan)
  return plan
}

// Runs
export async function listRuns(threadId: string) {
  const db = getDatabase()
  return db.select().from(schema.runs)
    .where(eq(schema.runs.threadId, threadId))
    .orderBy(desc(schema.runs.runNumber))
}

export async function getRun(id: string) {
  const db = getDatabase()
  const results = await db.select().from(schema.runs).where(eq(schema.runs.id, id))
  return results[0] ?? null
}

export async function createRun(data: {
  threadId: string
  planId: string
  checkpointCommit?: string
}) {
  const db = getDatabase()

  // Get next run number
  const existingRuns = await listRuns(data.threadId)
  const runNumber = existingRuns.length > 0
    ? Math.max(...existingRuns.map(r => r.runNumber)) + 1
    : 1

  const now = new Date()
  const run = {
    id: uuid(),
    threadId: data.threadId,
    planId: data.planId,
    runNumber,
    status: 'pending' as const,
    checkpointCommit: data.checkpointCommit ?? null,
    resultCommit: null,
    claudeSessionId: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now
  }
  await db.insert(schema.runs).values(run)
  return run
}

export async function updateRun(id: string, data: {
  status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  resultCommit?: string
  claudeSessionId?: string
  errorMessage?: string
}) {
  const db = getDatabase()
  const now = new Date()
  await db.update(schema.runs)
    .set({ ...data, updatedAt: now })
    .where(eq(schema.runs.id, id))
  return getRun(id)
}

// Run Events
export async function listRunEvents(runId: string) {
  const db = getDatabase()
  return db.select().from(schema.runEvents)
    .where(eq(schema.runEvents.runId, runId))
    .orderBy(schema.runEvents.timestamp)
}

export async function createRunEvent(data: {
  runId: string
  eventType: 'assistant' | 'tool_use' | 'tool_result' | 'error'
  data: Record<string, unknown>
}) {
  const db = getDatabase()
  const event = {
    id: uuid(),
    runId: data.runId,
    eventType: data.eventType,
    timestamp: new Date(),
    data: data.data
  }
  await db.insert(schema.runEvents).values(event)
  return event
}

// Learnings
export async function listLearnings(threadId: string) {
  const db = getDatabase()
  return db.select().from(schema.learnings)
    .where(eq(schema.learnings.threadId, threadId))
    .orderBy(desc(schema.learnings.createdAt))
}

export async function createLearning(data: {
  threadId: string
  runId: string
  category: 'error' | 'constraint' | 'insight'
  content: string
  appliedToPlanId?: string
}) {
  const db = getDatabase()
  const learning = {
    id: uuid(),
    threadId: data.threadId,
    runId: data.runId,
    category: data.category,
    content: data.content,
    appliedToPlanId: data.appliedToPlanId ?? null,
    createdAt: new Date()
  }
  await db.insert(schema.learnings).values(learning)
  return learning
}
