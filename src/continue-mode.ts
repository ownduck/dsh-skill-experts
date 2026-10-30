/** Per-parent continue-chat preference and expertId → childSessionId map. */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { continuePath } from './paths.ts'

/** One parent session's continue preference and child pointers. */
export interface ContinueParentEntry {
  readonly continue: boolean
  readonly children: Readonly<Record<string, string>>
}

/** On-disk continue document keyed by parent session id. */
export interface ContinueFile {
  readonly revision: number
  readonly byParent: Readonly<Record<string, ContinueParentEntry>>
}

/** Catalog row used for label fallback discovery. */
export interface ContinuableChildHint {
  readonly id: string
  readonly mode: string
  readonly label?: string
  readonly createdAt?: number
}

let cache: ContinueFile | undefined

function emptyFile(): ContinueFile {
  return { revision: 0, byParent: {} }
}

function readRaw(): ContinueFile {
  if (cache !== undefined) return cache
  const path = continuePath()
  if (!existsSync(path)) {
    cache = emptyFile()
    return cache
  }
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<ContinueFile>
    const byParent: Record<string, ContinueParentEntry> = {}
    if (raw.byParent !== undefined && typeof raw.byParent === 'object' && raw.byParent !== null) {
      for (const [parentId, entry] of Object.entries(raw.byParent)) {
        if (typeof parentId !== 'string' || parentId === '') continue
        if (entry === null || typeof entry !== 'object') continue
        const children: Record<string, string> = {}
        const rawChildren = (entry as { children?: unknown }).children
        if (rawChildren !== undefined && typeof rawChildren === 'object' && rawChildren !== null) {
          for (const [expertId, childId] of Object.entries(rawChildren)) {
            if (typeof expertId === 'string' && expertId !== ''
              && typeof childId === 'string' && childId !== '') {
              children[expertId] = childId
            }
          }
        }
        byParent[parentId] = {
          continue: (entry as { continue?: unknown }).continue === true,
          children,
        }
      }
    }
    cache = {
      revision: typeof raw.revision === 'number' ? raw.revision : 0,
      byParent,
    }
    return cache
  } catch {
    cache = emptyFile()
    return cache
  }
}

function writeRaw(file: ContinueFile): void {
  cache = file
  writeFileSync(continuePath(), `${JSON.stringify(file, undefined, 2)}\n`, 'utf8')
}

/** Upsert one parent entry; preserves continue default-on when creating. */
function upsertParent(
  parentId: string,
  next: (previous: ContinueParentEntry | undefined) => ContinueParentEntry,
): void {
  const current = readRaw()
  const previous = current.byParent[parentId]
  writeRaw({
    revision: current.revision + 1,
    byParent: {
      ...current.byParent,
      [parentId]: next(previous),
    },
  })
}

/**
 * Whether continue-chat is enabled for this parent session.
 * Missing preference defaults to on; only an explicit stored `false` turns it off.
 * @param parentSessionId - durable main session id.
 */
export function getContinueChat(parentSessionId: string): boolean {
  const id = parentSessionId.trim()
  if (id === '') return false
  const entry = readRaw().byParent[id]
  if (entry === undefined) return true
  return entry.continue
}

/**
 * Enable or disable continue-chat for a parent session.
 * Turning off keeps child pointers so a later turn-on can resume the last child.
 * @param parentSessionId - durable main session id.
 * @param enabled - desired preference.
 * @returns the stored preference.
 */
export function setContinueChat(parentSessionId: string, enabled: boolean): boolean {
  const id = parentSessionId.trim()
  if (id === '') return false
  upsertParent(id, previous => ({
    continue: enabled,
    children: { ...previous?.children },
  }))
  return enabled
}

/**
 * Look up the mapped child session id for one expert under a parent.
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id (not display name).
 */
export function getChildId(parentSessionId: string, expertId: string): string | undefined {
  const parent = parentSessionId.trim()
  const expert = expertId.trim()
  if (parent === '' || expert === '') return undefined
  const child = readRaw().byParent[parent]?.children[expert]
  return child !== undefined && child !== '' ? child : undefined
}

/**
 * Persist expertId → childSessionId for a parent.
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id.
 * @param childSessionId - continuable child session id.
 */
export function setChildId(parentSessionId: string, expertId: string, childSessionId: string): void {
  const parent = parentSessionId.trim()
  const expert = expertId.trim()
  const child = childSessionId.trim()
  if (parent === '' || expert === '' || child === '') return
  upsertParent(parent, previous => ({
    continue: previous === undefined ? true : previous.continue,
    children: { ...previous?.children, [expert]: child },
  }))
}

/**
 * Drop one expert's child pointer (e.g. after a failed cold resume).
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id.
 */
export function clearChildId(parentSessionId: string, expertId: string): void {
  const parent = parentSessionId.trim()
  const expert = expertId.trim()
  if (parent === '' || expert === '') return
  const previous = readRaw().byParent[parent]
  if (previous === undefined || previous.children[expert] === undefined) return
  const { [expert]: _removed, ...children } = previous.children
  upsertParent(parent, () => ({ continue: previous.continue, children }))
}

/**
 * Resolve a child session id: disk map first, then newest continuable child
 * whose label matches the expert display name.
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id for the disk key.
 * @param expertName - display name used only for listChildren fallback.
 * @param children - optional catalog rows from `subagents.listChildren`.
 */
export function resolveChildId(
  parentSessionId: string,
  expertId: string,
  expertName: string,
  children?: readonly ContinuableChildHint[],
): string | undefined {
  const mapped = getChildId(parentSessionId, expertId)
  if (mapped !== undefined) return mapped
  if (children === undefined || children.length === 0) return undefined
  const name = expertName.trim()
  if (name === '') return undefined
  const matches = children.filter(row => (
    row.mode === 'continuable'
    && typeof row.label === 'string'
    && row.label === name
    && typeof row.id === 'string'
    && row.id !== ''
  ))
  if (matches.length === 0) return undefined
  matches.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
  const found = matches[0]?.id
  if (found === undefined) return undefined
  setChildId(parentSessionId, expertId, found)
  return found
}
