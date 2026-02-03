export interface ExtractedLearning {
  category: 'error' | 'constraint' | 'insight'
  content: string
  confidence: number
}

export class LearningExtractorService {
  extractFromEvents(events: Array<{
    eventType: string
    data: Record<string, unknown>
  }>): ExtractedLearning[] {
    const learnings: ExtractedLearning[] = []

    for (const event of events) {
      const extracted = this.extractFromEvent(event)
      learnings.push(...extracted)
    }

    // Deduplicate similar learnings
    return this.deduplicateLearnings(learnings)
  }

  private extractFromEvent(event: {
    eventType: string
    data: Record<string, unknown>
  }): ExtractedLearning[] {
    const learnings: ExtractedLearning[] = []
    const text = this.extractText(event.data)

    if (!text) return learnings

    // Check for error patterns
    if (event.eventType === 'error') {
      learnings.push({
        category: 'error',
        content: this.cleanErrorMessage(text),
        confidence: 1.0
      })
    }

    // Check for common error patterns in any output
    const errorPatterns = [
      { pattern: /Error: (.+)/gi, category: 'error' as const },
      { pattern: /TypeError: (.+)/gi, category: 'error' as const },
      { pattern: /ReferenceError: (.+)/gi, category: 'error' as const },
      { pattern: /SyntaxError: (.+)/gi, category: 'error' as const },
      { pattern: /ENOENT: (.+)/gi, category: 'constraint' as const },
      { pattern: /EACCES: (.+)/gi, category: 'constraint' as const },
      { pattern: /permission denied/gi, category: 'constraint' as const },
      { pattern: /command not found: (.+)/gi, category: 'constraint' as const },
      { pattern: /Module not found: (.+)/gi, category: 'constraint' as const },
      { pattern: /Cannot find module '(.+)'/gi, category: 'constraint' as const }
    ]

    for (const { pattern, category } of errorPatterns) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        learnings.push({
          category,
          content: match[0],
          confidence: 0.9
        })
      }
    }

    // Check for test failures
    if (text.includes('FAIL') && text.includes('test')) {
      const testFailMatch = text.match(/FAIL\s+(.+\.(?:test|spec)\.[jt]sx?)/i)
      if (testFailMatch) {
        learnings.push({
          category: 'error',
          content: `Test failure in ${testFailMatch[1]}`,
          confidence: 0.85
        })
      }
    }

    // Check for lint/type errors
    if (text.includes('error TS') || text.includes('error:')) {
      const tsErrorMatch = text.match(/error TS\d+: (.+)/gi)
      if (tsErrorMatch) {
        for (const match of tsErrorMatch) {
          learnings.push({
            category: 'error',
            content: match,
            confidence: 0.9
          })
        }
      }
    }

    return learnings
  }

  private extractText(data: Record<string, unknown>): string {
    if (typeof data.text === 'string') return data.text
    if (typeof data.message === 'string') return data.message
    if (typeof data.output === 'string') return data.output
    if (typeof data.content === 'string') return data.content
    return ''
  }

  private cleanErrorMessage(message: string): string {
    // Remove ANSI color codes
    const cleaned = message.replace(/\x1b\[[0-9;]*m/g, '')
    // Limit length
    return cleaned.slice(0, 500).trim()
  }

  private deduplicateLearnings(learnings: ExtractedLearning[]): ExtractedLearning[] {
    const seen = new Set<string>()
    const unique: ExtractedLearning[] = []

    for (const learning of learnings) {
      const key = `${learning.category}:${learning.content.slice(0, 100)}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(learning)
      }
    }

    // Sort by confidence
    return unique.sort((a, b) => b.confidence - a.confidence)
  }

  refinePlanWithLearnings(planContent: string, learnings: ExtractedLearning[]): string {
    if (learnings.length === 0) return planContent

    const learningsSummary = learnings
      .map(l => `- [${l.category.toUpperCase()}] ${l.content}`)
      .join('\n')

    return `${planContent}

---

## Learnings from Previous Attempts

The following issues were encountered in previous runs. Please address them in this attempt:

${learningsSummary}
`
  }
}

export const learningExtractorService = new LearningExtractorService()
