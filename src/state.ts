/** Enabled-expert preference under `$DSH_HOME/skill-experts/state.json`. */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { SkillExpertsError } from './errors.ts'
import { statePath } from './paths.ts'

/** On-disk enablement document. */
export interface ExpertsStateFile {
  readonly revision: number
  readonly enabled: readonly string[]
}

function readRaw(): ExpertsStateFile {
  const path = statePath()
  if (!existsSync(path)) return { revision: 0, enabled: [] }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<ExpertsStateFile>
    return {
      revision: typeof raw.revision === 'number' ? raw.revision : 0,
      enabled: Array.isArray(raw.enabled)
        ? raw.enabled.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return { revision: 0, enabled: [] }
  }
}

function writeRaw(state: ExpertsStateFile): void {
  writeFileSync(statePath(), `${JSON.stringify(state, undefined, 2)}\n`, 'utf8')
}

/** @returns current enablement document. */
export function readState(): ExpertsStateFile {
  return readRaw()
}

/** @returns enabled expert ids as a Set. */
export function enabledSet(): Set<string> {
  return new Set(readRaw().enabled)
}

/**
 * Ensure every known expert has an enablement entry on first run.
 * Missing state enables all `knownIds` (backward compatible default).
 * @param knownIds - catalog expert ids.
 */
export function ensureState(knownIds: readonly string[]): ExpertsStateFile {
  const path = statePath()
  if (!existsSync(path)) {
    const state = { revision: 1, enabled: [...knownIds] }
    writeRaw(state)
    return state
  }
  const current = readRaw()
  const known = new Set(knownIds)
  const enabled = current.enabled.filter(id => known.has(id))
  if (enabled.length === current.enabled.length) return current
  const next = { revision: current.revision + 1, enabled }
  writeRaw(next)
  return next
}

/**
 * Enable or disable one expert.
 * @param id - expert id.
 * @param enabled - desired state.
 * @param knownIds - catalog ids (drops orphan enable entries).
 */
export function setExpertEnabled(id: string, enabled: boolean, knownIds: readonly string[]): ExpertsStateFile {
  const known = new Set(knownIds)
  if (!known.has(id)) throw new SkillExpertsError('expert-not-found', `expert "${id}" not found`)
  const current = ensureState(knownIds)
  const nextEnabled = new Set(current.enabled.filter(item => known.has(item)))
  if (enabled) nextEnabled.add(id)
  else nextEnabled.delete(id)
  const next = { revision: current.revision + 1, enabled: [...nextEnabled].sort() }
  writeRaw(next)
  return next
}

/**
 * Drop an expert from the enablement list after deletion.
 * @param id - removed expert id.
 * @param knownIds - remaining catalog ids.
 */
export function forgetExpert(id: string, knownIds: readonly string[]): void {
  const current = readRaw()
  const known = new Set(knownIds)
  const enabled = current.enabled.filter(item => item !== id && known.has(item))
  if (enabled.length === current.enabled.length) return
  writeRaw({ revision: current.revision + 1, enabled })
}

/**
 * Enable a newly created expert.
 * @param id - new expert id.
 * @param knownIds - catalog ids including `id`.
 */
export function enableNewExpert(id: string, knownIds: readonly string[]): void {
  setExpertEnabled(id, true, knownIds)
}
