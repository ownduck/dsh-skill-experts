/** Disk catalog and expert/skill CRUD under `$DSH_HOME/skill-experts`. */

import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SkillExpertsError } from './errors.ts'
import {
  catalogPath, expertDir, expertMetaPath, expertSkillsDir, isKebabName, presetIdFor, skillDir, skillMdPath,
} from './paths.ts'
import { parseSkillMd, serializeSkillMd } from './skill-md.ts'
import {
  enableNewExpert, enabledSet, ensureState, forgetExpert, setExpertEnabled,
} from './state.ts'
import type {
  CatalogFile, ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSource, ExpertSummary, SkillDetail, SkillSaveInput,
  SkillSummary,
} from './types.ts'

/** Seed folder names shipped with the package (legacy installs without `builtin`). */
const LEGACY_BUILTIN_IDS = new Set(['code-reviewer', 'tech-writer'])

function seedIds(seedRoot: string): string[] {
  if (!existsSync(seedRoot)) return []
  return readdirSync(seedRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()
}

function resolveBuiltin(id: string, rawBuiltin: unknown): boolean {
  if (rawBuiltin === true) return true
  if (rawBuiltin === false) return false
  return LEGACY_BUILTIN_IDS.has(id)
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
  const builtin = resolveBuiltin(id, raw.builtin)
  return { id, name, description, avatar, persona, builtin }
}

function writeMeta(meta: ExpertMeta): void {
  mkdirSync(expertDir(meta.id), { recursive: true })
  mkdirSync(expertSkillsDir(meta.id), { recursive: true })
  const payload = {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    avatar: meta.avatar,
    persona: meta.persona,
    builtin: meta.builtin === true,
  }
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
    skillCount: skills.length,
    presetId: presetIdFor(meta.id),
    source: sourceOf(meta),
    enabled,
    skills,
    rootPath: expertDir(meta.id),
  }
}

function allocExpertId(name: string): string {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-+|-+$/gu, '') || 'expert'
  let id = isKebabName(base) ? base : `expert-${base.replace(/[^a-z0-9-]/gu, '') || 'x'}`
  if (!isKebabName(id)) id = `expert-${Date.now().toString(36)}`
  const catalog = readCatalog()
  if (!catalog.experts.includes(id) && !existsSync(expertDir(id))) return id
  let n = 2
  while (catalog.experts.includes(`${id}-${n}`) || existsSync(expertDir(`${id}-${n}`))) n += 1
  return `${id}-${n}`
}

/**
 * Ensure seed experts exist and stamp builtin / enablement defaults.
 * @param seedRoot - package `assets/seed` directory.
 */
export function ensureSeeded(seedRoot = fileURLToPath(new URL('../assets/seed/', import.meta.url))): void {
  const seeds = seedIds(seedRoot)
  for (const id of seeds) LEGACY_BUILTIN_IDS.add(id)

  if (!existsSync(catalogPath())) {
    mkdirSync(expertDir('_tmp'), { recursive: true })
    rmSync(expertDir('_tmp'), { recursive: true, force: true })
    const experts: string[] = []
    for (const id of seeds) {
      cpSync(join(seedRoot, id), expertDir(id), { recursive: true })
      const meta = readMeta(id)
      writeMeta({ ...meta, builtin: true })
      experts.push(id)
    }
    writeCatalog({ revision: 1, experts: experts.sort() })
  } else {
    // Migrate legacy metas that omit `builtin`.
    for (const id of readCatalog().experts) {
      try {
        const meta = readMeta(id)
        const path = expertMetaPath(id)
        const raw = JSON.parse(readFileSync(path, 'utf8')) as { builtin?: unknown }
        if (raw.builtin === undefined && meta.builtin === true) writeMeta(meta)
      } catch {
        // Skip unreadable experts; list/get will surface them later.
      }
    }
  }
  ensureState(readCatalog().experts)
}

/** List expert summaries in catalog order. */
export function listExperts(): ExpertSummary[] {
  const catalog = readCatalog()
  ensureState(catalog.experts)
  const enabled = enabledSet()
  return catalog.experts.flatMap(id => {
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
    builtin: previous.builtin === true,
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
  readMeta(expertId)
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
  if (fromName !== undefined && fromName !== '' && fromName !== name) {
    const from = skillDir(expertId, fromName)
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
  readMeta(expertId)
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
