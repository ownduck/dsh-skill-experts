/** Map Host Remote failures to skill-experts locale strings. */

import type { ExpertsKey } from './locales.ts'

type Translate = (key: ExpertsKey) => string

const REASON_KEYS = new Set<string>([
  'expert-not-found',
  'name-required',
  'persona-required',
  'builtin-cannot-delete',
  'skill-name-required',
  'skill-name-kebab',
  'skill-description-required',
  'skill-prompt-required',
  'skill-not-found',
  'skill-exists',
  'zip-empty',
  'zip-invalid-layout',
  'zip-missing-skill-md',
  'zip-missing-meta',
  'generic',
])

function isRemoteFailure(value: unknown): value is {
  readonly code: string
  readonly details?: { readonly reason?: unknown }
} {
  return typeof value === 'object'
    && value !== null
    && (value as { isDSHRemoteError?: unknown }).isDSHRemoteError === true
    && typeof (value as { code?: unknown }).code === 'string'
}

function reasonKey(reason: string): ExpertsKey | undefined {
  if (!REASON_KEYS.has(reason)) return undefined
  return `error.${reason}` as ExpertsKey
}

/**
 * Localize a caught Remote / Host failure for panel display.
 * @param error - thrown value from inject call helpers.
 * @param t - bound skill-experts translator.
 */
export function formatRemoteError(error: unknown, t: Translate): string {
  if (isRemoteFailure(error)) {
    const reason = error.details?.reason
    if (typeof reason === 'string') {
      const key = reasonKey(reason)
      if (key !== undefined) return t(key)
    }
    if (error.code === 'skill-experts/not-found') return t('error.notFound')
    if (error.code === 'skill-experts/invalid') return t('error.invalid')
    if (error.code === 'skill-experts/zip') return t('error.zip')
  }
  return t('error.generic')
}
