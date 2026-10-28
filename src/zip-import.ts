/** Validate and import skill zip archives into an expert's skills directory. */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import JSZip from 'jszip'
import { readMeta, saveSkill } from './catalog.ts'
import { SkillExpertsError } from './errors.ts'
import { isKebabName, skillDir, skillMdPath } from './paths.ts'
import { parseSkillMd, serializeSkillMd } from './skill-md.ts'

interface ImportedSkill {
  readonly folder: string
  readonly files: Map<string, Uint8Array>
}

/**
 * Import one or more skills from a zip buffer.
 * @param expertId - target expert.
 * @param bytes - zip contents.
 * @returns imported skill names.
 */
export async function importSkillsZip(expertId: string, bytes: Uint8Array): Promise<string[]> {
  if (readMeta(expertId).builtin === true) {
    throw new SkillExpertsError(
      'builtin-cannot-import-skill',
      `built-in expert "${expertId}" cannot import skills`,
    )
  }
  const zip = await JSZip.loadAsync(bytes)
  const entries = Object.keys(zip.files).filter(name => !zip.files[name]!.dir)
  if (entries.length === 0) throw new SkillExpertsError('zip-empty', 'zip is empty')

  const normalized = entries.map(name => name.replace(/\\/gu, '/').replace(/^\/+/u, ''))
  const singleRoot = normalized.every(name => name === 'SKILL.md' || name.startsWith('SKILL.md/'))
    || normalized.some(name => name === 'SKILL.md') && normalized.every(name => !name.includes('/') || name.split('/').length === 1)

  let packs: ImportedSkill[]
  if (normalized.includes('SKILL.md') && normalized.every(name => !name.includes('/'))) {
    packs = [await loadPack(zip, '', 'SKILL.md')]
  } else if (singleRoot && normalized.includes('SKILL.md')) {
    packs = [await loadPack(zip, '', 'SKILL.md')]
  } else {
    const folders = new Set<string>()
    for (const name of normalized) {
      const parts = name.split('/')
      if (parts.length < 2) {
        throw new SkillExpertsError(
          'zip-invalid-layout',
          `invalid zip layout: unexpected root file "${name}" (use root SKILL.md for one skill, or folders each with SKILL.md)`,
        )
      }
      folders.add(parts[0]!)
    }
    packs = []
    for (const folder of [...folders].sort()) {
      const skillPath = `${folder}/SKILL.md`
      if (!normalized.includes(skillPath)) {
        throw new SkillExpertsError('zip-missing-skill-md', `folder "${folder}" has no SKILL.md`)
      }
      packs.push(await loadPack(zip, folder, skillPath))
    }
  }

  const imported: string[] = []
  for (const pack of packs) {
    const mdBytes = pack.files.get('SKILL.md')
    if (mdBytes === undefined) throw new SkillExpertsError('zip-missing-skill-md', 'missing SKILL.md')
    const text = new TextDecoder('utf8').decode(mdBytes)
    const parsed = parseSkillMd(text, pack.folder === '' ? 'SKILL.md' : `${pack.folder}/SKILL.md`)
    if (!isKebabName(parsed.frontmatter.name)) {
      throw new SkillExpertsError(
        'skill-name-kebab',
        `skill name "${parsed.frontmatter.name}" must be kebab-case`,
      )
    }
    const targetName = parsed.frontmatter.name
    saveSkill(expertId, {
      name: targetName,
      description: parsed.frontmatter.description,
      prompt: parsed.prompt,
    })
    // Rewrite SKILL.md from parser so description stays consistent, then overlay extra files.
    writeFileSync(
      skillMdPath(expertId, targetName),
      serializeSkillMd({
        name: parsed.frontmatter.name,
        description: parsed.frontmatter.description,
        prompt: parsed.prompt,
      }),
      'utf8',
    )
    for (const [rel, data] of pack.files) {
      if (rel === 'SKILL.md') continue
      const abs = join(skillDir(expertId, targetName), ...rel.split('/'))
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, data)
    }
    imported.push(targetName)
  }
  return imported
}

async function loadPack(zip: JSZip, folder: string, skillPath: string): Promise<ImportedSkill> {
  const files = new Map<string, Uint8Array>()
  const prefix = folder === '' ? '' : `${folder}/`
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue
    const norm = name.replace(/\\/gu, '/').replace(/^\/+/u, '')
    if (folder === '') {
      if (norm.includes('/')) continue
      files.set(norm, await entry.async('uint8array'))
      continue
    }
    if (!norm.startsWith(prefix)) continue
    const rel = norm.slice(prefix.length)
    if (rel === '' || rel.includes('..')) continue
    files.set(posix.normalize(rel), await entry.async('uint8array'))
  }
  if (!files.has('SKILL.md') && skillPath.endsWith('SKILL.md')) {
    const entry = zip.file(skillPath)
    if (entry) files.set('SKILL.md', await entry.async('uint8array'))
  }
  if (!files.has('SKILL.md')) throw new SkillExpertsError('zip-missing-skill-md', `missing ${skillPath}`)
  return { folder, files }
}
