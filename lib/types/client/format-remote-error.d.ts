/** Map Host Remote failures to skill-experts locale strings. */
import type { ExpertsKey } from './locales.ts';
type Translate = (key: ExpertsKey) => string;
/**
 * Localize a caught Remote / Host failure for panel display.
 * @param error - thrown value from inject call helpers.
 * @param t - bound skill-experts translator.
 */
export declare function formatRemoteError(error: unknown, t: Translate): string;
export {};
