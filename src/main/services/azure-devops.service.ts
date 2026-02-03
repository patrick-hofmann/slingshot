import { loadSettings } from './settings.service'

export interface WorkItem {
  id: number
  title: string
  state: string
  type: string
  description: string
  url: string
}

export interface AzureDevOpsConfig {
  organization: string
  pat: string
}

function getConfig(): AzureDevOpsConfig | null {
  const settings = loadSettings()
  if (!settings.azureDevOps.organization || !settings.azureDevOps.pat) {
    return null
  }
  return {
    organization: settings.azureDevOps.organization,
    pat: settings.azureDevOps.pat
  }
}

function getAuthHeader(pat: string): string {
  const token = Buffer.from(`:${pat}`).toString('base64')
  return `Basic ${token}`
}

export async function fetchWorkItem(workItemId: number): Promise<WorkItem | null> {
  const config = getConfig()
  if (!config) {
    return null
  }

  const url = `https://dev.azure.com/${config.organization}/_apis/wit/workitems/${workItemId}?api-version=7.0`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': getAuthHeader(config.pat),
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`Azure DevOps API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    return {
      id: data.id,
      title: data.fields['System.Title'],
      state: data.fields['System.State'],
      type: data.fields['System.WorkItemType'],
      description: data.fields['System.Description'] || '',
      url: data._links?.html?.href || ''
    }
  } catch (error) {
    console.error('Failed to fetch work item:', error)
    return null
  }
}

export async function searchWorkItems(project: string, query: string): Promise<WorkItem[]> {
  const config = getConfig()
  if (!config) {
    return []
  }

  const wiql = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType]
                FROM WorkItems
                WHERE [System.TeamProject] = '${project}'
                AND ([System.Title] CONTAINS '${query}' OR [System.Description] CONTAINS '${query}')
                ORDER BY [System.ChangedDate] DESC`

  const url = `https://dev.azure.com/${config.organization}/${project}/_apis/wit/wiql?api-version=7.0`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(config.pat),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: wiql })
    })

    if (!response.ok) {
      console.error(`Azure DevOps API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const workItemIds = data.workItems?.map((wi: { id: number }) => wi.id) || []

    if (workItemIds.length === 0) {
      return []
    }

    // Fetch work item details
    const detailsUrl = `https://dev.azure.com/${config.organization}/_apis/wit/workitems?ids=${workItemIds.slice(0, 20).join(',')}&api-version=7.0`
    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'Authorization': getAuthHeader(config.pat),
        'Content-Type': 'application/json'
      }
    })

    if (!detailsResponse.ok) {
      return []
    }

    const details = await detailsResponse.json()
    return details.value.map((wi: Record<string, unknown>) => ({
      id: wi.id,
      title: (wi.fields as Record<string, string>)['System.Title'],
      state: (wi.fields as Record<string, string>)['System.State'],
      type: (wi.fields as Record<string, string>)['System.WorkItemType'],
      description: (wi.fields as Record<string, string>)['System.Description'] || '',
      url: ((wi._links as Record<string, Record<string, string>>)?.html?.href) || ''
    }))
  } catch (error) {
    console.error('Failed to search work items:', error)
    return []
  }
}

export async function updateWorkItemState(workItemId: number, state: string): Promise<boolean> {
  const config = getConfig()
  if (!config) {
    return false
  }

  const url = `https://dev.azure.com/${config.organization}/_apis/wit/workitems/${workItemId}?api-version=7.0`

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': getAuthHeader(config.pat),
        'Content-Type': 'application/json-patch+json'
      },
      body: JSON.stringify([
        {
          op: 'add',
          path: '/fields/System.State',
          value: state
        }
      ])
    })

    return response.ok
  } catch (error) {
    console.error('Failed to update work item:', error)
    return false
  }
}

export async function addWorkItemComment(workItemId: number, comment: string): Promise<boolean> {
  const config = getConfig()
  if (!config) {
    return false
  }

  const url = `https://dev.azure.com/${config.organization}/_apis/wit/workitems/${workItemId}/comments?api-version=7.0-preview.3`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(config.pat),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: comment })
    })

    return response.ok
  } catch (error) {
    console.error('Failed to add comment:', error)
    return false
  }
}

export function parseWorkItemFromUrl(url: string): number | null {
  // Match Azure DevOps work item URLs like:
  // https://dev.azure.com/org/project/_workitems/edit/123
  // https://org.visualstudio.com/project/_workitems/edit/123
  const match = url.match(/_workitems\/edit\/(\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}

export function isAzureDevOpsConfigured(): boolean {
  return getConfig() !== null
}
