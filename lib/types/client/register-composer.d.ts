/** Composer button + @ mention source for skill-expert reference chips. */
import type { Context } from '@deepseek-ai/cordis';
/**
 * Register composer left button and a bottom `@` group for skill experts.
 * @param ctx - client context (slots, locale, remote, inputTriggers, sessions).
 * @returns disposer.
 */
export declare function registerComposerExperts(ctx: Context): () => void;
