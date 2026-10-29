/** Export / import skill experts as zip packages (single or batch). */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import JSZip from 'jszip'
import { getExpert, normalizeEnvVars, replaceExpertEnv, saveExpert, saveSkill } from './catalog.ts'
import { SkillExpertsError } from './errors.ts'
import { exportSlug } from './export-slug.ts'
import { expertSkillsDir, isKebabName, skillDir, skillMdPath } from './paths.ts'
import { parseSkillMd } from './skill-md.ts'
import type { ExpertDetail, ExpertEnvVar } from './types.ts'

export interface ExpertZipExport {
  readonly filename: string
  readonly bytes: Uint8Array
}

export interface ExpertZipImportResult {
  readonly count: number
  readonly ids: readonly string[]
}

type ExpertMetaPayload = {
  readonly name: string
  readonly description: string
  readonly avatar: string
  readonly persona: string
  readonly envVars: readonly ExpertEnvVar[]
}

/**
 * Pack one expert: root `meta.json` + `skills/<name>/…`.
 * @param id - expert id on disk.
 */
export async function exportExpertZip(id: string): Promise<ExpertZipExport> {
  const detail = getExpert(id)
  const zip = new JSZip()
  addExpertToZip(zip, detail.id, '')
  const bytes = await zip.generateAsync({ type: 'uint8array' })
  return { filename: `${exportSlug(detail.name)}.zip`, bytes }
}

/**
 * Pack many experts: each under `{slug}/meta.json` + `skills/…`.
 * @param ids - expert ids (order preserved when possible).
 */
export async function exportExpertsZip(ids: readonly string[]): Promise<ExpertZipExport> {
  if (ids.length === 0) throw new SkillExpertsError('expert-not-found', 'no experts selected')
  const zip = new JSZip()
  const used = new Set<string>()
  for (const id of ids) {
    const detail = getExpert(id)
    const folder = uniqueSlug(exportSlug(detail.name), used)
    addExpertToZip(zip, detail.id, `${folder}/`)
  }
  const bytes = await zip.generateAsync({ type: 'uint8array' })
  return { filename: 'skill-experts.zip', bytes }
}

/**
 * Import a single-expert or multi-expert zip as new custom experts.
 * @param ctx - Host context (required when the zip declares envVars).
 * @param bytes - zip contents.
 */
export async function importExpertZip(ctx: Context, bytes: Uint8Array): Promise<ExpertZipImportResult> {
  const zip = await JSZip.loadAsync(bytes)
  const entries = Object.keys(zip.files).filter(name => !zip.files[name]!.dir)
  if (entries.length === 0) throw new SkillExpertsError('zip-empty', 'zip is empty')

  const normalized = entries.map(name => name.replace(/\\/gu, '/').replace(/^\/+/u, ''))
  const packs = detectExpertPacks(normalized)
  if (packs.length === 0) {
    throw new SkillExpertsError('zip-missing-meta', 'missing meta.json')
  }

  const ids: string[] = []
  for (const prefix of packs) {
    const detail = await importOneExpert(ctx, zip, normalized, prefix)
    ids.push(detail.id)
  }
  return { count: ids.length, ids }
}

function detectExpertPacks(normalized: readonly string[]): string[] {
  if (normalized.includes('meta.json')) return ['']

  const folders = new Set<string>()
  for (const name of normalized) {
    const parts = name.split('/')
    if (parts.length >= 2 && parts[1] === 'meta.json' && parts[0] !== undefined && parts[0] !== '') {
      folders.add(parts[0])
    }
  }
  if (folders.size === 0) return []
  if (folders.size === 1) {
    const only = [...folders][0]!
    return [`${only}/`]
  }
  return [...folders].sort().map(folder => `${folder}/`)
}

async function importOneExpert(
  ctx: Context,
  zip: JSZip,
  normalized: readonly string[],
  prefix: string,
): Promise<ExpertDetail> {
  const metaPath = `${prefix}meta.json`
  const metaEntry = zip.file(metaPath)
  if (metaEntry === null) throw new SkillExpertsError('zip-missing-meta', `missing ${metaPath}`)
  const meta = parseMeta(JSON.parse(await metaEntry.async('string')))
  let detail = saveExpert({
    name: meta.name,
    description: meta.description,
    avatar: meta.avatar,
    persona: meta.persona,
  })
  if (meta.envVars.length > 0) {
    detail = await replaceExpertEnv(ctx, detail.id, meta.envVars)
  }
  const skillsPrefix = `${prefix}skills/`

  const skillFolders = new Set<string>()
  for (const rel of normalized) {
    if (!rel.startsWith(skillsPrefix)) continue
    const rest = rel.slice(skillsPrefix.length)
    const parts = rest.split('/')
    if (parts.length < 2 || parts[0] === '') continue
    skillFolders.add(parts[0]!)
  }

  for (const folder of [...skillFolders].sort()) {
    const skillMdRel = `${skillsPrefix}${folder}/SKILL.md`
    if (!normalized.includes(skillMdRel)) {
      throw new SkillExpertsError('zip-missing-skill-md', `folder "${folder}" has no SKILL.md`)
    }
    const mdEntry = zip.file(skillMdRel)
    if (mdEntry === null) {
      throw new SkillExpertsError('zip-missing-skill-md', `missing ${skillMdRel}`)
    }
    const text = await mdEntry.async('string')
    const parsed = parseSkillMd(text, skillMdRel)
    if (!isKebabName(parsed.frontmatter.name)) {
      throw new SkillExpertsError(
        'skill-name-kebab',
        `skill name "${parsed.frontmatter.name}" must be kebab-case`,
      )
    }
    saveSkill(detail.id, {
      name: parsed.frontmatter.name,
      description: parsed.frontmatter.description,
      prompt: parsed.prompt,
    })
    const targetName = parsed.frontmatter.name
    for (const rel of normalized) {
      if (!rel.startsWith(`${skillsPrefix}${folder}/`)) continue
      const within = rel.slice(`${skillsPrefix}${folder}/`.length)
      if (within === '' || within.includes('..')) continue
      if (within === 'SKILL.md') continue
      const entry = zip.file(rel)
      if (entry === null || entry.dir) continue
      const abs = join(skillDir(detail.id, targetName), ...within.split('/'))
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, await entry.async('nodebuffer'))
    }
  }

  return getExpert(detail.id)
}

function parseMeta(raw: unknown): ExpertMetaPayload {
  const metaRaw = raw as {
    name?: unknown
    description?: unknown
    avatar?: unknown
    persona?: unknown
    envVars?: unknown
  }
  const name = typeof metaRaw.name === 'string' ? metaRaw.name.trim() : ''
  const description = typeof metaRaw.description === 'string' ? metaRaw.description.trim() : ''
  const avatar = typeof metaRaw.avatar === 'string' && metaRaw.avatar.trim() !== ''
    ? metaRaw.avatar.trim()
    : '📖'
  const persona = typeof metaRaw.persona === 'string' ? metaRaw.persona.trim() : ''
  if (name === '') throw new SkillExpertsError('name-required', 'expert name is required')
  if (persona === '') throw new SkillExpertsError('persona-required', 'expert persona prompt is required')
  const envVars = parseExportEnvVars(metaRaw.envVars)
  return { name, description, avatar, persona, envVars }
}

function parseExportEnvVars(raw: unknown): ExpertEnvVar[] {
  if (!Array.isArray(raw)) return []
  const loose: ExpertEnvVar[] = []
  for (const item of raw) {
    if (item === null || typeof item !== 'object') continue
    const row = item as { name?: unknown; value?: unknown }
    if (typeof row.name !== 'string') continue
    const name = row.name.trim()
    if (name === '') continue
    loose.push({ name, value: typeof row.value === 'string' ? row.value : '' })
  }
  return normalizeEnvVars(loose)
}

/** Export values: live `process.env` when set (including empty), else meta default. */
function exportEnvVars(detail: ExpertDetail): ExpertEnvVar[] {
  return detail.envVars.map(entry => ({
    name: entry.name,
    value: process.env[entry.name] !== undefined ? process.env[entry.name]! : entry.value,
  }))
}

function addExpertToZip(zip: JSZip, expertId: string, prefix: string): void {
  const detail = getExpert(expertId)
  const envVars = exportEnvVars(detail)
  const payload: Record<string, unknown> = {
    name: detail.name,
    description: detail.description,
    avatar: detail.avatar,
    persona: detail.persona,
  }
  if (envVars.length > 0) payload.envVars = envVars
  zip.file(`${prefix}meta.json`, `${JSON.stringify(payload, undefined, 2)}\n`)

  const skillsRoot = expertSkillsDir(expertId)
  if (!existsSync(skillsRoot)) return
  for (const skillName of readdirSync(skillsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()) {
    if (!existsSync(skillMdPath(expertId, skillName))) continue
    addDirToZip(zip, skillDir(expertId, skillName), `${prefix}skills/${skillName}`)
  }
}

function uniqueSlug(base: string, used: Set<string>): string {
  let candidate = base
  let n = 2
  while (used.has(candidate)) {
    candidate = `${base}-${n}`
    n += 1
  }
  used.add(candidate)
  return candidate
}

function addDirToZip(zip: JSZip, absDir: string, zipPrefix: string): void {
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const abs = join(absDir, entry.name)
    const rel = posix.join(zipPrefix, entry.name)
    if (entry.isDirectory()) {
      addDirToZip(zip, abs, rel)
      continue
    }
    if (entry.isFile()) zip.file(rel, readFileSync(abs))
  }
}

export { exportSlug }
