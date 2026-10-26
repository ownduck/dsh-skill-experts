/** Mount Remote contribution and the sidebar main panel. */
import type { Context } from '@deepseek-ai/cordis';
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
export declare const inject: readonly ["remote", "slots", "locale"];
/**
 * Mount the skill-experts Remote and sidebar UI.
 * @param ctx - Client plugin lifetime.
 * @param contribution - generated controller Remote definitions.
 */
export declare function mountSkillExperts(ctx: Context, contribution: TypertRemoteContribution): Promise<() => Promise<void>>;
