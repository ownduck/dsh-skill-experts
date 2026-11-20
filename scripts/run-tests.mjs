/** Run node:test specs with tsx and the DSH peer packages from this package's devDependencies. */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const loader = join(root, 'node_modules', 'tsx', 'dist', 'loader.mjs')
if (!existsSync(loader)) {
  process.stderr.write('tsx loader not found; run npm install first.\n')
  process.exit(1)
}

const testsDir = join(root, 'tests')
const specs = readdirSync(testsDir)
  .filter(name => name.endsWith('.spec.ts'))
  .sort()
  .map(name => join('tests', name))
if (specs.length === 0) {
  process.stderr.write('no tests/*.spec.ts files found\n')
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  ['--import', pathToFileURL(loader).href, '--test', ...specs],
  { cwd: root, stdio: 'inherit' },
)
process.exit(result.status ?? 1)
