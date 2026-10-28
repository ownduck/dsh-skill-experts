/** Shared DSH_HOME temp fixture for node:test specs. */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface TempDshHome {
  readonly home: string
  restore(): void
}

/**
 * Point `DSH_HOME` at a fresh temp directory for catalog/disk tests.
 * @param prefix - mkdtemp prefix under os.tmpdir().
 */
export function withTempDshHome(prefix = 'dsh-skill-experts-'): TempDshHome {
  const previous = process.env.DSH_HOME
  const home = mkdtempSync(join(tmpdir(), prefix))
  process.env.DSH_HOME = home
  return {
    home,
    restore() {
      if (previous === undefined) delete process.env.DSH_HOME
      else process.env.DSH_HOME = previous
      rmSync(home, { recursive: true, force: true })
    },
  }
}
