/**
 * Main Host plugin: summon tools and system-prompt guidance.
 *
 * Remotes live on `@woosau/dsh-skill-experts/remote` (separate Cordis row).
 * This entry injects `tools` / `systemPrompt` like dsh-agency-agents' main row,
 * so cold-boot gateway / welcome RPC are not blocked waiting for those services.
 */

import type { Context } from '@deepseek-ai/cordis'
import { registerSummonTools } from './summon.ts'

export type {
  CatalogFile, ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput, SkillSummary,
} from './types.ts'

/** Cordis plugin name (loader entry). */
export const name = 'skill-experts'

/** Wait for Host tool / prompt services before registering summon tools. */
export const inject = ['tools', 'systemPrompt'] as const

/**
 * Register list/summon tools once tools and systemPrompt exist.
 * @param ctx - Host context with tools and systemPrompt.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => registerSummonTools(ctx), 'skill-experts: summon tools')
}
