/** Curated emoji avatars for the expert editor modal. */
/** Default avatar when creating an expert (open book). */
export declare const DEFAULT_AVATAR = "\uD83D\uDCD6";
/**
 * True when the glyph has no ZWJ (excludes compounds like 👩‍💻).
 * @param glyph - candidate avatar string.
 */
export declare function isSingleEmoji(glyph: string): boolean;
/**
 * Selectable avatars: symbol tools + single-codepoint roles (no ZWJ).
 * Omits glyphs that commonly render as tofu on Windows 10.
 */
export declare const AVATAR_CHOICES: readonly string[];
