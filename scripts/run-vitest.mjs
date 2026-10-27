import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const webStorageFlag = '--no-experimental-webstorage'
const inheritedNodeOptions = process.env.NODE_OPTIONS?.trim() ?? ''
const nodeOptions = inheritedNodeOptions.split(/\s+/u).includes(webStorageFlag)
  ? inheritedNodeOptions
  : [inheritedNodeOptions, webStorageFlag].filter(Boolean).join(' ')

const result = spawnSync(process.execPath, [
  resolve('node_modules', 'vitest', 'vitest.mjs'),
  'run',
  '--maxWorkers=1',
  '--pool=threads',
  ...process.argv.slice(2),
], { env: { ...process.env, NODE_OPTIONS: nodeOptions }, stdio: 'inherit' })

if (result.error) throw result.error
process.exitCode = result.status ?? 1
