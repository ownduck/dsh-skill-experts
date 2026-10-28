/** Build download-safe zip basenames from expert display names. */

import { pinyin } from 'pinyin-pro'

/**
 * Convert an expert display name to a zip basename slug (no `.zip`).
 * Chinese becomes tone-less full pinyin joined by `-`; ASCII is kebab-cased.
 * @param name - expert display name.
 */
export function exportSlug(name: string): string {
  const trimmed = name.trim()
  if (trimmed === '') return 'expert'
  const romanized = pinyin(trimmed, {
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive',
  })
    .map(part => String(part).toLowerCase())
    .join('-')
  const slug = romanized
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .replace(/-{2,}/gu, '-')
  return slug === '' ? 'expert' : slug
}
