/** Build download-safe zip basenames from expert display names. */
/**
 * Convert an expert display name to a zip basename slug (no `.zip`).
 * Chinese becomes tone-less full pinyin joined by `-`; ASCII is kebab-cased.
 * @param name - expert display name.
 */
export declare function exportSlug(name: string): string;
