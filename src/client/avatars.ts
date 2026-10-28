/** Curated emoji avatars for the expert editor modal. */

/** Default avatar when creating an expert (open book). */
export const DEFAULT_AVATAR = '📖'

/**
 * True when the glyph has no ZWJ (excludes compounds like 👩‍💻).
 * @param glyph - candidate avatar string.
 */
export function isSingleEmoji(glyph: string): boolean {
  return glyph.length > 0 && !glyph.includes('\u200D')
}

/**
 * Selectable avatars: symbol tools + single-codepoint roles (no ZWJ).
 * Omits glyphs that commonly render as tofu on Windows 10.
 */
export const AVATAR_CHOICES: readonly string[] = [
  // Symbol tools (default 📖 first among books)
  '📖', '📚', '🔎', '✍️', '🧪', '🛠️', '📐', '🎨',
  '🧠', '💡', '🧭', '🗺️', '🛡️', '⚙️', '🧩', '🔬',
  '📊', '📈', '📝', '🗂️', '🧰', '🏗️', '🎯', '🚀',
  '📦', '🔗', '⚡',
  // Single-glyph roles (widely supported; no ninja / fantasy set that tofu on Win10)
  '👮', '🕵️', '💂', '👷', '🤴', '👸', '🤵', '👰',
  '👲', '👳', '👱', '🎅', '👼', '🤡',
].filter(isSingleEmoji)
