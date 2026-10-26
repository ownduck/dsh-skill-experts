/** Disk catalog and expert/skill CRUD under `$DSH_HOME/skill-experts`. */

import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  catalogPath, expertDir, expertMetaPath, expertSkillsDir, isKebabName, presetIdFor, skillDir, skillMdPath,
} from './paths.ts'
import { parseSkillMd, serializeSkillMd } from './skill-md.ts'
import type {
  CatalogFile, ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput, SkillSummary,
} from './types.ts'

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
  if (!existsSync(path)) throw new Error(`expert "${id}" not found`)
  const raw = JSON.parse(readFileSync(path, 'utf8')) as ExpertMeta
  if (raw.id !== id) throw new Error(`expert meta id mismatch for "${id}"`)
  return raw
}

function writeMeta(meta: ExpertMeta): void {
  mkdirSync(expertDir(meta.id), { recursive: true })
  mkdirSync(expertSkillsDir(meta.id), { recursive: true })
  writeFileSync(expertMetaPath(meta.id), `${JSON.stringify(meta, undefined, 2)}\n`, 'utf8')
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
    note: parsed.frontmatter.note ?? '',
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

function toDetail(meta: ExpertMeta): ExpertDetail {
  const skills = listSkillNames(meta.id).map(name => readSkillSummary(meta.id, name))
  return {
    id: meta.id,
    name: meta.name,
    avatar: meta.avatar,
    persona: meta.persona,
    skillCount: skills.length,
    presetId: presetIdFor(meta.id),
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

/** Ensure seed experts exist when catalog is missing. */
export function ensureSeeded(seedRoot = fileURLToPath(new URL('../assets/seed/', import.meta.url))): void {
  if (existsSync(catalogPath())) {
    readCatalog()
    return
  }
  mkdirSync(expertDir('_tmp'), { recursive: true })
  rmSync(expertDir('_tmp'), { recursive: true, force: true })
  const experts: string[] = []
  if (!existsSync(seedRoot)) {
    writeCatalog({ revision: 1, experts })
    return
  }
  for (const entry of readdirSync(seedRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const from = join(seedRoot, entry.name)
    const to = expertDir(entry.name)
    cpSync(from, to, { recursive: true })
    experts.push(entry.name)
  }
  writeCatalog({ revision: 1, experts: experts.sort() })
}

/** List expert summaries in catalog order. */
export function listExperts(): ExpertSummary[] {
  const catalog = readCatalog()
  return catalog.experts.flatMap(id => {
    try {
      const detail = toDetail(readMeta(id))
      return [{
        id: detail.id,
        name: detail.name,
        avatar: detail.avatar,
        skillCount: detail.skillCount,
        presetId: detail.presetId,
      }]
    } catch {
      return []
    }
  })
}

/** Load one expert. */
export function getExpert(id: string): ExpertDetail {
  return toDetail(readMeta(id))
}

/** Create or update expert metadata. */
export function saveExpert(input: ExpertSaveInput): ExpertDetail {
  const name = input.name.trim()
  if (name === '') throw new Error('expert name is required')
  const avatar = input.avatar.trim() || '🧠'
  const persona = input.persona.trim()
  if (persona === '') throw new Error('expert persona is required')
  const catalog = readCatalog()
  let id = input.id?.trim()
  if (id === undefined || id === '') {
    id = allocExpertId(name)
    writeMeta({ id, name, avatar, persona })
    writeCatalog({ revision: catalog.revision + 1, experts: [...catalog.experts, id].sort() })
    return toDetail(readMeta(id))
  }
  if (!catalog.experts.includes(id)) throw new Error(`expert "${id}" not found`)
  writeMeta({ id, name, avatar, persona })
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts })
  return toDetail(readMeta(id))
}

/** Delete an expert and its files. */
export function deleteExpert(id: string): void {
  const catalog = readCatalog()
  if (!catalog.experts.includes(id)) throw new Error(`expert "${id}" not found`)
  rmSync(expertDir(id), { recursive: true, force: true })
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts.filter(item => item !== id) })
}

/** Load skill editor payload. */
export function getSkill(expertId: string, skillName: string): SkillDetail {
  readMeta(expertId)
  return readSkillDetail(expertId, skillName)
}

/** Create or update a skill. */
export function saveSkill(expertId: string, input: SkillSaveInput): SkillDetail {
  readMeta(expertId)
  const name = input.name.trim()
  const description = input.description.trim()
  if (!isKebabName(name)) throw new Error('skill name must be kebab-case')
  if (description === '') throw new Error('skill description is required')
  const fromName = input.fromName?.trim()
  const target = skillDir(expertId, name)
  if (fromName !== undefined && fromName !== '' && fromName !== name) {
    const from = skillDir(expertId, fromName)
    if (!existsSync(from)) throw new Error(`skill "${fromName}" not found`)
    if (existsSync(target)) throw new Error(`skill "${name}" already exists`)
    renameSync(from, target)
  } else {
    mkdirSync(target, { recursive: true })
  }
  writeFileSync(
    skillMdPath(expertId, name),
    serializeSkillMd({
      name,
      description,
      prompt: input.prompt,
      ...input.note === undefined || input.note.trim() === '' ? {} : { note: input.note.trim() },
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
  if (!existsSync(path)) throw new Error(`skill "${skillName}" not found`)
  rmSync(path, { recursive: true, force: true })
  const catalog = readCatalog()
  writeCatalog({ revision: catalog.revision + 1, experts: catalog.experts })
}

/** All expert ids currently on disk (catalog). */
export function expertIds(): readonly string[] {
  return readCatalog().experts
}

export { readMeta }
