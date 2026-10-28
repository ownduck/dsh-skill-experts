/** Shared reference-chip payload for composer button and @ menu. */
/** Host input-trigger source id / chip `source` field. */
export declare const EXPERT_CHIP_SOURCE: "skill-experts";
/** Minimal expert fields needed to build a chip. */
export interface ExpertChipSource {
    readonly id: string;
    readonly name: string;
}
/** Native composer reference insert (matches Host `ReferenceInsert`). */
export interface ExpertReferenceInsert {
    readonly source: typeof EXPERT_CHIP_SOURCE;
    readonly ref: string;
    readonly label: string;
    readonly appearance: 'session';
    readonly clipboardText: string;
}
/**
 * UI / clipboard chip text: `@DisplayName` + NBSP (agency `Tl`/`El`).
 * @param name - expert display name.
 */
export declare function expertClipboardText(name: string): string;
/**
 * Model-facing serialization for a skill-expert chip.
 * Keeps the visible `@Name` marker and adds a mandatory summon directive so
 * `@` mentions always trigger `summon_skill_expert` (session preset selection is separate).
 * @param expert - enabled expert row.
 */
export declare function expertModelSerializeText(expert: ExpertChipSource): string;
/**
 * Build the insert payload used by both the composer button and `@` onPick.
 * @param expert - enabled expert row.
 */
export declare function buildExpertChip(expert: ExpertChipSource): ExpertReferenceInsert;
