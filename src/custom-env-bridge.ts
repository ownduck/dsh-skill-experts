/** Optional Host bridge to `@woosau/dsh-custom-env` (`ctx.customEnv`). */

import type { Context } from '@deepseek-ai/cordis'
import { SkillExpertsError } from './errors.ts'
import type { ExpertEnvVar } from './types.ts'

/** Duck-typed subset of the custom-env Host service. */
export interface CustomEnvApi {
  setVar(name: string, value: string): Promise<void>
  removeVar(name: string): Promise<boolean>
}

function isCustomEnvApi(value: unknown): value is CustomEnvApi {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as { setVar?: unknown; removeVar?: unknown }
  return typeof candidate.setVar === 'function' && typeof candidate.removeVar === 'function'
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
 * Apply env entries to custom-env: set each, remove names no longer present.
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
  for (const entry of previous) {
    if (!nextNames.has(entry.name)) await api.removeVar(entry.name)
  }
  for (const entry of next) {
    await api.setVar(entry.name, entry.value)
  }
}
