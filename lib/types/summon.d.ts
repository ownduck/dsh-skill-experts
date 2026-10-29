/** Model tools: list and summon skill experts as spawn subagents (agency-style await). */
import type { Context } from '@deepseek-ai/cordis';
declare const LIST = "list_skill_experts";
declare const SUMMON = "summon_skill_expert";
/** One enabled expert line for the model-facing catalog. */
export type ExpertCatalogEntry = {
    readonly name: string;
    readonly description: string;
    readonly id: string;
};
/**
 * Skill-style catalog lines: ``- `name`: description`` (id kept for summon).
 * @param entries - Enabled experts.
 * @returns Model-facing bullet lines.
 */
export declare function renderExpertCatalogEntries(entries: readonly ExpertCatalogEntry[]): string[];
/**
 * Register list/summon tools and system-prompt guidance (agency-style).
 * Avoid importing `@deepseek-ai/dsh-tools`: linked installs resolve from the
 * package realpath and cannot see Host-bundled DSH packages beyond the peers
 * the Loader already exposes (typert / home-paths).
 * @param ctx - Host context with tools / subagents / systemPrompt.
 * @returns disposer.
 */
export declare function registerSummonTools(ctx: Context): () => void;
export { LIST as LIST_TOOL, SUMMON as SUMMON_TOOL };
