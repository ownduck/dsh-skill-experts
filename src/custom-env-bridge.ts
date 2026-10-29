/** Optional Host bridge to `@woosau/dsh-custom-env` (`ctx.customEnv`). */

import type { Context } from '@deepseek-ai/cordis'
import { SkillExpertsError } from './errors.ts'
import type { ExpertEnvVar } from './types.ts'

/** Duck-typed subset of the custom-env Host service (batch APIs). */
export interface CustomEnvApi {
  setVars(entries: readonly ExpertEnvVar[]): Promise<void>
  removeVars(names: readonly string[]): Promise<number>
}

function isCustomEnvApi(value: unknown): value is CustomEnvApi {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as { setVars?: unknown; removeVars?: unknown }
  return typeof candidate.setVars === 'function' && typeof candidate.removeVars === 'function'
}

/**
 * Look up custom-env when installed (O(1) Cordis store get; no I/O).
 * @param ctx - Host context.
 */
export function getCustomEnv(ctx: Context): CustomEnvApi | undefined {
  const value = ctx.get('customEnv')
  return isCustomEnvApi(value) ? value : undefined
}

/**
 * Require custom-env or throw a stable Client-localizable error.
 * @param ctx - Host context.
 */
export function requireCustomEnv(ctx: Context): CustomEnvApi {
  const api = getCustomEnv(ctx)
  if (api === undefined) {
    throw new SkillExpertsError(
      'custom-env-missing',
      'custom-env plugin is not installed or not loaded',
    )
  }
  return api
}

/**
 * Whether custom-env is available on this Host.
 * @param ctx - Host context.
 */
export function customEnvAvailable(ctx: Context): boolean {
  return getCustomEnv(ctx) !== undefined
}

/**
 * Apply env entries to custom-env: batch-remove dropped names, then batch-set next.
 * @param api - custom-env service.
 * @param previous - prior declared names.
 * @param next - next declared entries.
 */
export async function syncEnvToCustomEnv(
  api: CustomEnvApi,
  previous: readonly ExpertEnvVar[],
  next: readonly ExpertEnvVar[],
): Promise<void> {
  const nextNames = new Set(next.map(entry => entry.name))
  const removed = previous.map(entry => entry.name).filter(name => !nextNames.has(name))
  if (removed.length > 0) await api.removeVars(removed)
  if (next.length > 0) await api.setVars(next)
}
