/** Parse and serialize SKILL.md (`name` + `description` frontmatter, body as prompt). */

import { parse as parseYaml } from 'yaml'

export interface SkillFrontmatter {
  name: string
  description: string
}

export interface ParsedSkillMd {
  frontmatter: SkillFrontmatter
  prompt: string
  raw: string
}

/**
 * Parse a SKILL.md body.
 * @param raw - file contents.
 * @param path - for errors.
 */
export function parseSkillMd(raw: string, path: string): ParsedSkillMd {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw)
  if (match?.[1] === undefined) throw new Error(`${path}: missing YAML frontmatter`)
  const metadata: unknown = parseYaml(match[1])
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    throw new Error(`${path}: frontmatter must be a mapping`)
  }
  const record = metadata as Record<string, unknown>
  const name = record.name
  const description = record.description
  if (typeof name !== 'string' || name.trim() === '') throw new Error(`${path}: name is required`)
  if (typeof description !== 'string' || description.trim() === '') throw new Error(`${path}: description is required`)
  return {
    frontmatter: { name: name.trim(), description: description.trim() },
    prompt: raw.slice(match[0].length).replace(/^\r?\n/u, ''),
    raw,
  }
}

/**
 * Serialize skill fields to SKILL.md text.
 * @param fields - frontmatter + body.
 */
export function serializeSkillMd(fields: { name: string; description: string; prompt: string }): string {
  const lines = [
    '---',
    `name: ${yamlScalar(fields.name)}`,
    `description: ${yamlScalar(fields.description)}`,
    '---',
    '',
    fields.prompt.replace(/^\uFEFF/u, '').replace(/\s+$/u, ''),
    '',
  ]
  return lines.join('\n')
}

function yamlScalar(value: string): string {
  if (/^[\w./@+-]+$/u.test(value) && !/^(?:true|false|null|yes|no|on|off)$/iu.test(value)) return value
  return JSON.stringify(value)
}
