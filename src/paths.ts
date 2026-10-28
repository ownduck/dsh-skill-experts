/** Resolve skill-experts storage under `$DSH_HOME`. */

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths'

/** Root directory for all skill experts. */
export function expertsRoot(): string {
  const root = join(resolveDshHome(), 'skill-experts')
  mkdirSync(root, { recursive: true })
  return root
}

/** Catalog JSON path. */
export function catalogPath(): string {
  return join(expertsRoot(), 'catalog.json')
}

/** Enablement preferences JSON path. */
export function statePath(): string {
  return join(expertsRoot(), 'state.json')
}

/** Per-parent continue-chat preference and child-session map. */
export function continuePath(): string {
  return join(expertsRoot(), 'continue.json')
}

/** One expert directory. */
export function expertDir(id: string): string {
  return join(expertsRoot(), id)
}

/** Expert meta.json path. */
export function expertMetaPath(id: string): string {
  return join(expertDir(id), 'meta.json')
}

/** Skills root for one expert. */
export function expertSkillsDir(id: string): string {
  return join(expertDir(id), 'skills')
}

/** One skill directory. */
export function skillDir(expertId: string, skillName: string): string {
  return join(expertSkillsDir(expertId), skillName)
}

/** SKILL.md path. */
export function skillMdPath(expertId: string, skillName: string): string {
  return join(skillDir(expertId, skillName), 'SKILL.md')
}

/** Registry preset id for an expert. */
export function presetIdFor(expertId: string): string {
  return `skill-expert-${expertId}`
}

/** Kebab-case skill / expert id check (DSH skill name rules). */
export function isKebabName(value: string): boolean {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(value)
}
