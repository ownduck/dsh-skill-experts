/** Disk catalog and expert/skill CRUD under `$DSH_HOME/skill-experts`. */

import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import { requireCustomEnv, syncEnvToCustomEnv } from './custom-env-bridge.ts'
import { SkillExpertsError } from './errors.ts'
import { exportSlug } from './export-slug.ts'
import {
  catalogPath, expertDir, expertMetaPath, expertSkillsDir, expertsRoot, isKebabName, presetIdFor, skillDir, skillMdPath,
} from './paths.ts'
import { parseSkillMd, serializeSkillMd } from './skill-md.ts'
import {
  enableNewExpert, enabledSet, ensureState, forgetExpert, setExpertEnabled,
} from './state.ts'
import type {
  CatalogFile, ExpertDetail, ExpertEnvVar, ExpertMeta, ExpertSaveInput, ExpertSource, ExpertSummary, SkillDetail,
  SkillSaveInput, SkillSummary,
} from './types.ts'

/** Writable env var names (aligned with custom-env ordinary names). */
const ENV_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/u

/**
 * Normalize and validate expert env var rows.
 * @param raw - candidate rows.
 */
export function normalizeEnvVars(raw: readonly ExpertEnvVar[]): ExpertEnvVar[] {
  const out: ExpertEnvVar[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    const name = item.name.trim()
    const value = typeof item.value === 'string' ? item.value : ''
    if (name === '') continue
    if (!ENV_NAME_RE.test(name)) {
      throw new SkillExpertsError('env-name-invalid', `invalid env name "${name}"`)
    }
    if (seen.has(name)) {
      throw new SkillExpertsError('env-name-duplicate', `duplicate env name "${name}"`)
    }
    seen.add(name)
    out.push({ name, value })
  }
  return out
}

function parseEnvVars(raw: unknown): ExpertEnvVar[] {
  if (!Array.isArray(raw)) return []
  const loose: ExpertEnvVar[] = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const row = item as { name?: unknown; value?: unknown }
    if (typeof row.name !== 'string') continue
    const name = row.name.trim()
    if (name === '') continue
    const value = typeof row.value === 'string' ? row.value : ''
    loose.push({ name, value })
  }
  try {
    return normalizeEnvVars(loose)
  } catch {
    // Legacy / hand-edited meta: keep first valid unique names, drop invalids.
    const out: ExpertEnvVar[] = []
    const seen = new Set<string>()
    for (const entry of loose) {
      if (!ENV_NAME_RE.test(entry.name) || seen.has(entry.name)) continue
      seen.add(entry.name)
      out.push(entry)
    }
    return out
  }
}

/**
 * Current package seed ids. Used when `meta.json` omits `builtin` so older
 * on-disk seeds still resolve as built-in. Filled in `ensureSeeded`.
 */
const SEED_BUILTIN_IDS = new Set<string>()

function seedIds(seedRoot: string): string[] {
  if (!existsSync(seedRoot)) return []
  return readdirSync(seedRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

/**
 * Drop catalog builtins that are no longer shipped under `assets/seed`.
 * Customs (`builtin: false`) are left alone even if the id matches an old seed.
 * @param experts - current catalog expert ids.
 * @param seedIdSet - ids present in the package seed root.
 * @returns updated id list and whether anything changed.
 */
function retireAbsentSeedBuiltins(
  experts: string[],
  seedIdSet: Set<string>,
): { experts: string[]; changed: boolean } {
  let next = [...experts]
  let changed = false
  for (const id of experts) {
    if (seedIdSet.has(id)) continue
    const metaPath = expertMetaPath(id)
    if (!existsSync(metaPath)) {
      next = next.filter(item => item !== id)
      forgetExpert(id, next)
      changed = true
      continue
    }
    let isBuiltin = false
    try {
      isBuiltin = readMeta(id).builtin === true
    } catch {
      // Leave unreadable non-seed entries for list/get to surface.
      continue
    }
    if (!isBuiltin) continue
    rmSync(expertDir(id), { recursive: true, force: true })
    next = next.filter(item => item !== id)
    forgetExpert(id, next)
    changed = true
  }
  return { experts: next, changed }
}

function resolveBuiltin(id: string, rawBuiltin: unknown): boolean {
  if (rawBuiltin === true) return true
  if (rawBuiltin === false) return false
  return SEED_BUILTIN_IDS.has(id)
}

function sourceOf(meta: ExpertMeta): ExpertSource {
  return meta.builtin === true ? 'builtin' : 'custom'
}

function readCatalog(): CatalogFile {
  const path = catalogPath()
  if (!existsSync(path)) return { revision: 0, experts: [] }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as CatalogFile
  return {
    revision: typeof raw.revision === 'number' ? raw.revision : 0,
    experts: Array.isArray(raw.experts) ? raw.experts.filter((id): id is string => typeof id === 'string') : [],
  }
}

function writeCatalog(catalog: CatalogFile): void {
  writeFileSync(catalogPath(), `${JSON.stringify(catalog, undefined, 2)}\n`, 'utf8')
}

function readMeta(id: string): ExpertMeta {
  const path = expertMetaPath(id)
  if (!existsSync(path)) throw new SkillExpertsError('expert-not-found', `expert "${id}" not found`)
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<ExpertMeta> & { id?: string }
  if (raw.id !== id) throw new SkillExpertsError('expert-not-found', `expert meta id mismatch for "${id}"`)
  const name = typeof raw.name === 'string' ? raw.name : ''
  const description = typeof raw.description === 'string' ? raw.description : ''
  const avatar = typeof raw.avatar === 'string' && raw.avatar.trim() !== '' ? raw.avatar : '🧠'
  const persona = typeof raw.persona === 'string' ? raw.persona : ''
  const envVars = parseEnvVars(raw.envVars)
  const builtin = resolveBuiltin(id, raw.builtin)
  return {
    id,
    name,
    description,
    avatar,
    persona,
    ...(envVars.length > 0 ? { envVars } : {}),
    builtin,
  }
}

function writeMeta(meta: ExpertMeta): void {
  mkdirSync(expertDir(meta.id), { recursive: true })
  mkdirSync(expertSkillsDir(meta.id), { recursive: true })
  const envVars = meta.envVars === undefined ? [] : normalizeEnvVars(meta.envVars)
  const payload: Record<string, unknown> = {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    avatar: meta.avatar,
    persona: meta.persona,
    builtin: meta.builtin === true,
  }
  if (envVars.length > 0) payload.envVars = envVars
  writeFileSync(expertMetaPath(meta.id), `${JSON.stringify(payload, undefined, 2)}\n`, 'utf8')
}

function listSkillNames(expertId: string): string[] {
  const root = expertSkillsDir(expertId)
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => existsSync(skillMdPath(expertId, name)))
    .sort()
}

function readSkillSummary(expertId: string, skillName: string): SkillSummary {
  const absolutePath = skillDir(expertId, skillName)
  const parsed = parseSkillMd(readFileSync(skillMdPath(expertId, skillName), 'utf8'), skillMdPath(expertId, skillName))
  return {
    name: parsed.frontmatter.name,
    description: parsed.frontmatter.description,
    absolutePath,
  }
}

function readSkillDetail(expertId: string, skillName: string): SkillDetail {
  const summary = readSkillSummary(expertId, skillName)
  const parsed = parseSkillMd(readFileSync(skillMdPath(expertId, skillName), 'utf8'), skillMdPath(expertId, skillName))
  const extraFiles = readdirSync(skillDir(expertId, skillName), { withFileTypes: true })
    .flatMap(entry => {
      if (entry.name === 'SKILL.md') return []
      if (entry.isFile()) return [entry.name]
      if (entry.isDirectory()) return listFilesRecursive(join(skillDir(expertId, skillName), entry.name), entry.name)
      return []
    })
    .sort()
  return { ...summary, prompt: parsed.prompt, extraFiles }
}

function listFilesRecursive(abs: string, rel: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const nextRel = `${rel}/${entry.name}`
    if (entry.isFile()) out.push(nextRel)
    else if (entry.isDirectory()) out.push(...listFilesRecursive(join(abs, entry.name), nextRel))
  }
  return out
}

function toDetail(meta: ExpertMeta, enabled: boolean): ExpertDetail {
  const skills = listSkillNames(meta.id).map(name => readSkillSummary(meta.id, name))
  return {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    avatar: meta.avatar,
    persona: meta.persona,
    envVars: meta.envVars ?? [],
    skillCount: skills.length,
    presetId: presetIdFor(meta.id),
    source: sourceOf(meta),
    enabled,
    skills,
    rootPath: expertDir(meta.id),
  }
}

/**
 * Allocate a new on-disk expert id from the display name (pinyin kebab via {@link exportSlug}).
 * @param name - Expert display name.
 */
function allocExpertId(name: string): string {
  const slug = exportSlug(name)
  let id = isKebabName(slug) ? slug : `expert-${Date.now().toString(36)}`
  const catalog = readCatalog()
  if (!catalog.experts.includes(id) && !existsSync(expertDir(id))) return id
  let n = 2
  while (catalog.experts.includes(`${id}-${n}`) || existsSync(expertDir(`${id}-${n}`))) n += 1
  return `${id}-${n}`
}

/**
 * Ensure seed experts exist and stamp builtin / enablement defaults.
 * Missing seeds are copied into `$DSH_HOME` (fill-if-absent); existing local
 * copies are never overwritten. Plugin upgrades that add new seed folders
 * therefore deploy on the next Host load even when catalog.json already exists.
 * @param seedRoot - package `assets/seed` directory.
 */
export function ensureSeeded(seedRoot = fileURLToPath(new URL('../assets/seed/', import.meta.url))): void {
  const seeds = seedIds(seedRoot)
  SEED_BUILTIN_IDS.clear()
  for (const id of seeds) SEED_BUILTIN_IDS.add(id)
  const seedIdSet = new Set(seeds)
  expertsRoot()

  const catalog = readCatalog()
  let experts = [...catalog.experts]
  let changed = false
  const newlyAdded: string[] = []

  for (const id of seeds) {
    const metaPath = expertMetaPath(id)
    if (!existsSync(metaPath)) {
      cpSync(join(seedRoot, id), expertDir(id), { recursive: true })
      writeMeta({ ...readMeta(id), builtin: true })
      changed = true
    }
    if (!experts.includes(id)) {
      experts = [...experts, id]
      newlyAdded.push(id)
      changed = true
    }
  }

  const retired = retireAbsentSeedBuiltins(experts, seedIdSet)
  if (retired.changed) {
    experts = retired.experts
    changed = true
  }

  if (changed) {
    writeCatalog({
      revision: catalog.revision > 0 ? catalog.revision + 1 : 1,
      experts,
    })
    for (const id of newlyAdded) {
      enableNewExpert(id, experts)
    }
  }

  // Migrate legacy metas that omit `builtin`.
  for (const id of experts) {
    try {
      const meta = readMeta(id)
      const path = expertMetaPath(id)
      const raw = JSON.parse(readFileSync(path, 'utf8')) as { builtin?: unknown }
      if (raw.builtin === undefined && meta.builtin === true) writeMeta(meta)
    } catch {
      // Skip unreadable experts; list/get will surface them later.
    }
  }
  ensureState(readCatalog().experts)
}

/**
 * List expert summaries: built-ins first (catalog-relative order), then
 * customs in creation / catalog-append order.
 */
export function listExperts(): ExpertSummary[] {
  const catalog = readCatalog()
  ensureState(catalog.experts)
  const enabled = enabledSet()
  const rows = catalog.experts.flatMap(id => {
    try {
      const detail = toDetail(readMeta(id), enabled.has(id))
      return [{
        id: detail.id,
        name: detail.name,
        description: detail.description,
        avatar: detail.avatar,
        skillCount: detail.skillCount,
        presetId: detail.presetId,
        source: detail.source,
        enabled: detail.enabled,
      }]
    } catch {
      return []
    }
  })
  const builtins = rows.filter(row => row.source === 'builtin')
  const customs = rows.filter(row => row.source === 'custom')
  return [...builtins, ...customs]
}

/** Load one expert. */
export function getExpert(id: string): ExpertDetail {
  ensureState(readCatalog().experts)
  return toDetail(readMeta(id), enabledSet().has(id))
}

/**
 * Enable or disable one expert.
 * @param id - expert id.
 * @param enabled - desired state.
 */
export function setEnabled(id: string, enabled: boolean): ExpertDetail {
  const catalog = readCatalog()
  readMeta(id)
  setExpertEnabled(id, enabled, catalog.experts)
  return getExpert(id)
}

/** Create or update expert metadata. */
export function saveExpert(input: ExpertSaveInput): ExpertDetail {
  const name = input.name.trim()
  if (name === '') throw new SkillExpertsError('name-required', 'expert name is required')
  const description = input.description.trim()
  const avatar = input.avatar.trim() || '🧠'
  const persona = input.persona.trim()
  if (persona === '') throw new SkillExpertsError('persona-required', 'expert persona prompt is required')
  const catalog = readCatalog()
  let id = input.id?.trim()
  if (id === undefined || id === '') {
    id = allocExpertId(name)
    writeMeta({ id, name, description, avatar, persona, builtin: false })
    // Append only: catalog order is creation order (do not alpha-sort).
    const experts = [...catalog.experts, id]
    writeCatalog({ revision: catalog.revision + 1, experts })
    enableNewExpert(id, experts)
    return getExpert(id)
  }
  if (!catalog.experts.includes(id)) throw new SkillExpertsError('expert-not-found', `expert "${id}" not found`)
  const previous = readMeta(id)
  writeMeta({
    id,
    name,
    description,
    avatar,
    persona,
    envVars: previous.envVars,
    builtin: previous.builtin === true,
  })
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts })
  return getExpert(id)
}

/**
 * Replace an expert's declared env vars on disk and sync to custom-env.
 * @param ctx - Host context (needs custom-env).
 * @param id - expert id.
 * @param next - full replacement list.
 */
export async function replaceExpertEnv(
  ctx: Context,
  id: string,
  next: readonly ExpertEnvVar[],
): Promise<ExpertDetail> {
  const catalog = readCatalog()
  if (!catalog.experts.includes(id)) {
    throw new SkillExpertsError('expert-not-found', `expert "${id}" not found`)
  }
  const previous = readMeta(id)
  const normalized = normalizeEnvVars(next)
  const previousVars = previous.envVars ?? []
  let toWrite = normalized
  if (previous.builtin === true) {
    // Built-ins: names are fixed; only values may change.
    const nextByName = new Map(normalized.map(entry => [entry.name, entry.value]))
    if (
      nextByName.size !== previousVars.length
      || previousVars.some(entry => !nextByName.has(entry.name))
      || normalized.some(entry => !previousVars.some(prev => prev.name === entry.name))
    ) {
      throw new SkillExpertsError(
        'builtin-cannot-mutate-env',
        `built-in expert "${id}" cannot add, remove, or rename env vars`,
      )
    }
    toWrite = previousVars.map(entry => ({
      name: entry.name,
      value: nextByName.get(entry.name) ?? entry.value,
    }))
  }
  const api = requireCustomEnv(ctx)
  await syncEnvToCustomEnv(api, previousVars, toWrite)
  writeMeta({
    ...previous,
    envVars: toWrite,
  })
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts })
  return getExpert(id)
}

/** Delete a custom expert and its files. Built-in experts cannot be removed. */
export function deleteExpert(id: string): void {
  const catalog = readCatalog()
  if (!catalog.experts.includes(id)) throw new SkillExpertsError('expert-not-found', `expert "${id}" not found`)
  const meta = readMeta(id)
  if (meta.builtin === true) {
    throw new SkillExpertsError('builtin-cannot-delete', `built-in expert "${id}" cannot be deleted`)
  }
  rmSync(expertDir(id), { recursive: true, force: true })
  const experts = catalog.experts.filter(item => item !== id)
  writeCatalog({ revision: catalog.revision + 1, experts })
  forgetExpert(id, experts)
}

/** Load skill editor payload. */
export function getSkill(expertId: string, skillName: string): SkillDetail {
  readMeta(expertId)
  if (!existsSync(skillMdPath(expertId, skillName))) {
    throw new SkillExpertsError('skill-not-found', `skill "${skillName}" not found`)
  }
  return readSkillDetail(expertId, skillName)
}

/** Create or update a skill. */
export function saveSkill(expertId: string, input: SkillSaveInput): SkillDetail {
  const meta = readMeta(expertId)
  const name = input.name.trim()
  const description = input.description.trim()
  const prompt = input.prompt.trim()
  if (name === '') throw new SkillExpertsError('skill-name-required', 'skill name is required')
  if (!isKebabName(name)) throw new SkillExpertsError('skill-name-kebab', 'skill name must be kebab-case')
  if (description === '') {
    throw new SkillExpertsError('skill-description-required', 'skill description is required')
  }
  if (prompt === '') {
    throw new SkillExpertsError('skill-prompt-required', 'skill prompt is required')
  }
  const fromName = input.fromName?.trim()
  const target = skillDir(expertId, name)
  const renaming = fromName !== undefined && fromName !== '' && fromName !== name
  const creating = !renaming && !existsSync(target)
  if (meta.builtin === true && (creating || renaming)) {
    throw new SkillExpertsError(
      'builtin-cannot-add-skill',
      `built-in expert "${expertId}" cannot add or rename skills`,
    )
  }
  if (renaming) {
    const from = skillDir(expertId, fromName!)
    if (!existsSync(from)) throw new SkillExpertsError('skill-not-found', `skill "${fromName}" not found`)
    if (existsSync(target)) throw new SkillExpertsError('skill-exists', `skill "${name}" already exists`)
    renameSync(from, target)
  } else {
    mkdirSync(target, { recursive: true })
  }
  writeFileSync(
    skillMdPath(expertId, name),
    serializeSkillMd({
      name,
      description,
      prompt,
    }),
    'utf8',
  )
  const catalog = readCatalog()
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts })
  return readSkillDetail(expertId, name)
}

/** Delete one skill folder. */
export function deleteSkill(expertId: string, skillName: string): void {
  const meta = readMeta(expertId)
  if (meta.builtin === true) {
    throw new SkillExpertsError(
      'builtin-cannot-delete-skill',
      `built-in expert "${expertId}" skills cannot be deleted`,
    )
  }
  const path = skillDir(expertId, skillName)
  if (!existsSync(path)) throw new SkillExpertsError('skill-not-found', `skill "${skillName}" not found`)
  rmSync(path, { recursive: true, force: true })
  const catalog = readCatalog()
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts })
}

/** All expert ids currently on disk (catalog). */
export function expertIds(): readonly string[] {
  return readCatalog().experts
}

export { readMeta }
