/**
 * Main Host plugin: summon tools and system-prompt guidance.
 *
 * Remotes live on `@woosau/dsh-skill-experts/remote` (separate Cordis row).
 * This entry injects `tools` / `systemPrompt` like dsh-agency-agents' main row,
 * so cold-boot gateway / welcome RPC are not blocked waiting for those services.
 */
import type { Context } from '@deepseek-ai/cordis';
export type { CatalogFile, ExpertDetail, ExpertEnvVar, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput, SkillSummary, } from './types.ts';
/** Cordis plugin name (loader entry). */
export declare const name = "skill-experts";
/** Wait for Host tool / prompt services before registering summon tools. */
export declare const inject: readonly ["tools", "systemPrompt"];
/**
 * Register list/summon tools once tools and systemPrompt exist.
 * @param ctx - Host context with tools and systemPrompt.
 */
export declare function apply(ctx: Context): void;
