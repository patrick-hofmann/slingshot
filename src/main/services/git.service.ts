import git from 'isomorphic-git'
import fs from 'fs'
import { spawn } from 'child_process'

export interface GitStatus {
  modified: string[]
  added: string[]
  deleted: string[]
  untracked: string[]
}

export async function cloneRepository(url: string, dir: string): Promise<void> {
  // Use shell git for cloning (handles authentication better)
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['clone', url, dir], {
      stdio: 'pipe'
    })

    let stderr = ''
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Git clone failed: ${stderr}`))
      }
    })
  })
}

export async function getBranches(dir: string): Promise<string[]> {
  const branches = await git.listBranches({ fs, dir })
  return branches
}

export async function getCurrentBranch(dir: string): Promise<string> {
  return git.currentBranch({ fs, dir }) as Promise<string>
}

export async function getStatus(dir: string): Promise<GitStatus> {
  const statusMatrix = await git.statusMatrix({ fs, dir })

  const status: GitStatus = {
    modified: [],
    added: [],
    deleted: [],
    untracked: []
  }

  for (const [filepath, headStatus, workdirStatus, stageStatus] of statusMatrix) {
    if (headStatus === 1 && workdirStatus === 2 && stageStatus === 1) {
      status.modified.push(filepath)
    } else if (headStatus === 0 && workdirStatus === 2 && stageStatus === 0) {
      status.untracked.push(filepath)
    } else if (headStatus === 0 && workdirStatus === 2 && stageStatus === 2) {
      status.added.push(filepath)
    } else if (headStatus === 1 && workdirStatus === 0 && stageStatus === 0) {
      status.deleted.push(filepath)
    } else if (headStatus === 1 && workdirStatus === 2 && stageStatus === 2) {
      status.modified.push(filepath)
    }
  }

  return status
}

export async function createCheckpoint(dir: string): Promise<string> {
  // Stage all changes
  const status = await getStatus(dir)
  const allFiles = [
    ...status.modified,
    ...status.added,
    ...status.deleted,
    ...status.untracked
  ]

  for (const filepath of allFiles) {
    if (status.deleted.includes(filepath)) {
      await git.remove({ fs, dir, filepath })
    } else {
      await git.add({ fs, dir, filepath })
    }
  }

  // Create commit
  const sha = await git.commit({
    fs,
    dir,
    message: '[slingshot] checkpoint',
    author: {
      name: 'Slingshot',
      email: 'slingshot@local'
    }
  })

  return sha
}

export async function resetToCheckpoint(dir: string, commitSha: string): Promise<void> {
  // Use shell git for hard reset (isomorphic-git doesn't support this well)
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['reset', '--hard', commitSha], {
      cwd: dir,
      stdio: 'pipe'
    })

    let stderr = ''
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Git reset failed: ${stderr}`))
      }
    })
  })
}

export async function createBranch(dir: string, branchName: string): Promise<void> {
  await git.branch({ fs, dir, ref: branchName })
  await git.checkout({ fs, dir, ref: branchName })
}

export async function checkoutBranch(dir: string, branchName: string): Promise<void> {
  await git.checkout({ fs, dir, ref: branchName })
}

export async function getHeadCommit(dir: string): Promise<string> {
  const commits = await git.log({ fs, dir, depth: 1 })
  return commits[0].oid
}

export async function stashChanges(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['stash', 'push', '-m', '[slingshot] auto-stash'], {
      cwd: dir,
      stdio: 'pipe'
    })

    let stderr = ''
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Git stash failed: ${stderr}`))
      }
    })
  })
}

export async function popStash(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', ['stash', 'pop'], {
      cwd: dir,
      stdio: 'pipe'
    })

    let stderr = ''
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        // Stash pop can fail if there's nothing to pop - that's OK
        if (stderr.includes('No stash entries found')) {
          resolve()
        } else {
          reject(new Error(`Git stash pop failed: ${stderr}`))
        }
      }
    })
  })
}
