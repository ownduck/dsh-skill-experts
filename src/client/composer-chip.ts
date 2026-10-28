/** Shared reference-chip payload for composer button and @ menu. */

/** Host input-trigger source id / chip `source` field. */
export const EXPERT_CHIP_SOURCE = 'skill-experts' as const

/** Minimal expert fields needed to build a chip. */
export interface ExpertChipSource {
  readonly id: string
  readonly name: string
}

/** Native composer reference insert (matches Host `ReferenceInsert`). */
export interface ExpertReferenceInsert {
  readonly source: typeof EXPERT_CHIP_SOURCE
  readonly ref: string
  readonly label: string
  readonly appearance: 'session'
  readonly clipboardText: string
}

/**
 * UI / clipboard chip text: `@DisplayName` + NBSP (agency `Tl`/`El`).
 * @param name - expert display name.
 */
export function expertClipboardText(name: string): string {
  const cleaned = name.trim().replace(/^@+/u, '')
  return `@${cleaned}\u00A0`
}

/**
 * Model-facing serialization for a skill-expert chip.
 * Same as clipboard (`@Name` + NBSP). Summon behavior is owned by system prompt /
 * tool descriptions — do not inject directives into the user-visible draft text.
 * @param expert - enabled expert row.
 */
export function expertModelSerializeText(expert: ExpertChipSource): string {
  return expertClipboardText(expert.name)
}

/**
 * Build the insert payload used by both the composer button and `@` onPick.
 * @param expert - enabled expert row.
 */
export function buildExpertChip(expert: ExpertChipSource): ExpertReferenceInsert {
  return {
    source: EXPERT_CHIP_SOURCE,
    ref: expert.id,
    label: expert.name,
    appearance: 'session',
    clipboardText: expertClipboardText(expert.name),
  }
}
