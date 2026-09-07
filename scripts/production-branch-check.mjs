#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** Only the protected release branch is allowed to create production state.
 * @param {string} branch
 */
export function productionBranchProblems(branch) {
  if (branch === 'main') return []
  if (!branch)
    return ['the current Git branch could not be determined; production deploys fail closed']
  return [`production deployment is allowed only from main, not ${branch}`]
}

/**
 * Workers Builds exposes the triggering branch explicitly. GitHub Actions does
 * the same. Local runs fall back to the checked-out symbolic branch.
 */
export async function resolveDeploymentBranch(env = process.env, cwd = process.cwd()) {
  for (const key of ['WORKERS_CI_BRANCH', 'GITHUB_REF_NAME']) {
    const branch = env[key]?.trim()
    if (branch) return branch
  }

  try {
    const { stdout } = await execFileAsync('git', ['branch', '--show-current'], { cwd })
    return stdout.trim()
  } catch {
    return ''
  }
}

async function main() {
  const branch = await resolveDeploymentBranch()
  const problems = productionBranchProblems(branch)

  if (problems.length > 0) {
    console.error('Production branch policy blocked deployment:')
    for (const problem of problems) console.error(`  x ${problem}`)
    process.exit(1)
  }

  console.log('Production branch policy holds: deployment is running from main.')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
