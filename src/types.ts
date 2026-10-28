/** Whether the expert shipped with the plugin or was created by the user. */
export type ExpertSource = 'builtin' | 'custom'

/** Expert roster row for the sidebar and list tool. */
export interface ExpertSummary {
  readonly id: string
  readonly name: string
  /** Short blurb (SKILL.md `description` analogue). */
  readonly description: string
  readonly avatar: string
  readonly skillCount: number
  readonly presetId: string
  /** Built-in seed vs user-created. */
  readonly source: ExpertSource
  /** Whether the expert may be summoned / appears as enabled in the UI. */
  readonly enabled: boolean
}

/** Full expert record for editors. */
export interface ExpertDetail extends ExpertSummary {
  /** Persona system prompt (SKILL.md body analogue). */
  readonly persona: string
  readonly skills: readonly SkillSummary[]
  readonly rootPath: string
}

/** Skill table row. */
export interface SkillSummary {
  readonly name: string
  readonly description: string
  readonly absolutePath: string
}

/** Skill editor payload. */
export interface SkillDetail extends SkillSummary {
  readonly prompt: string
  readonly extraFiles: readonly string[]
}

/** Create or update expert fields. */
export interface ExpertSaveInput {
  readonly id?: string
  readonly name: string
  readonly description: string
  readonly avatar: string
  readonly persona: string
}

/** Create or update a skill under an expert. */
export interface SkillSaveInput {
  readonly name: string
  readonly description: string
  readonly prompt: string
  /** Rename from this skill folder when set and different from `name`. */
  readonly fromName?: string
}

/** Catalog file on disk. */
export interface CatalogFile {
  readonly revision: number
  readonly experts: readonly string[]
}

/** Persisted expert meta.json. */
export interface ExpertMeta {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly avatar: string
  readonly persona: string
  /** Seed experts are built-in; omit or false means custom. */
  readonly builtin?: boolean
}
