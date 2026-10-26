/** Model tools: list and summon skill experts as spawn subagents. */
import type { Context } from '@deepseek-ai/cordis';
declare const LIST = "list_skill_experts";
declare const SUMMON = "summon_skill_expert";
/**
 * Register list/summon tools and system-prompt guidance (agency-style).
 * @param ctx - Host context with tools / subagents / systemPrompt.
 * @returns disposer.
 */
export declare function registerSummonTools(ctx: Context): () => void;
export { LIST as LIST_TOOL, SUMMON as SUMMON_TOOL };
