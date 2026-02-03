import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  provider: text('provider', { enum: ['github', 'azure-devops'] }).notNull(),
  repoUrl: text('repo_url').notNull(),
  localPath: text('local_path').notNull(),
  settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const projectsRelations = relations(projects, ({ many }) => ({
  threads: many(threads)
}))

export const threads = sqliteTable('threads', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status', { enum: ['draft', 'planning', 'ready', 'running', 'completed', 'failed'] }).notNull().default('draft'),
  baseBranch: text('base_branch').notNull(),
  workingBranch: text('working_branch'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const threadsRelations = relations(threads, ({ one, many }) => ({
  project: one(projects, {
    fields: [threads.projectId],
    references: [projects.id]
  }),
  plans: many(plans),
  runs: many(runs),
  learnings: many(learnings)
}))

export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content').notNull(),
  source: text('source', { enum: ['user', 'refined', 'generated'] }).notNull(),
  parentPlanId: text('parent_plan_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const plansRelations = relations(plans, ({ one, many }) => ({
  thread: one(threads, {
    fields: [plans.threadId],
    references: [threads.id]
  }),
  parentPlan: one(plans, {
    fields: [plans.parentPlanId],
    references: [plans.id],
    relationName: 'planHierarchy'
  }),
  childPlans: many(plans, { relationName: 'planHierarchy' }),
  runs: many(runs)
}))

export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().references(() => plans.id),
  runNumber: integer('run_number').notNull(),
  status: text('status', { enum: ['pending', 'running', 'success', 'failed', 'cancelled'] }).notNull().default('pending'),
  checkpointCommit: text('checkpoint_commit'),
  resultCommit: text('result_commit'),
  claudeSessionId: text('claude_session_id'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

export const runsRelations = relations(runs, ({ one, many }) => ({
  thread: one(threads, {
    fields: [runs.threadId],
    references: [threads.id]
  }),
  plan: one(plans, {
    fields: [runs.planId],
    references: [plans.id]
  }),
  events: many(runEvents),
  learnings: many(learnings)
}))

export const runEvents = sqliteTable('run_events', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  eventType: text('event_type', { enum: ['assistant', 'tool_use', 'tool_result', 'error'] }).notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  data: text('data', { mode: 'json' }).$type<Record<string, unknown>>().notNull()
})

export const runEventsRelations = relations(runEvents, ({ one }) => ({
  run: one(runs, {
    fields: [runEvents.runId],
    references: [runs.id]
  })
}))

export const learnings = sqliteTable('learnings', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  runId: text('run_id').notNull().references(() => runs.id),
  category: text('category', { enum: ['error', 'constraint', 'insight'] }).notNull(),
  content: text('content').notNull(),
  appliedToPlanId: text('applied_to_plan_id').references(() => plans.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

export const learningsRelations = relations(learnings, ({ one }) => ({
  thread: one(threads, {
    fields: [learnings.threadId],
    references: [threads.id]
  }),
  run: one(runs, {
    fields: [learnings.runId],
    references: [runs.id]
  }),
  appliedToPlan: one(plans, {
    fields: [learnings.appliedToPlanId],
    references: [plans.id]
  })
}))
