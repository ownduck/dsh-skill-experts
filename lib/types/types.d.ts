/** Expert roster row for the sidebar and list tool. */
export interface ExpertSummary {
    readonly id: string;
    readonly name: string;
    readonly avatar: string;
    readonly skillCount: number;
    readonly presetId: string;
}
/** Full expert record for editors. */
export interface ExpertDetail extends ExpertSummary {
    readonly persona: string;
    readonly skills: readonly SkillSummary[];
    readonly rootPath: string;
}
/** Skill table row. */
export interface SkillSummary {
    readonly name: string;
    readonly description: string;
    readonly note: string;
    readonly absolutePath: string;
}
/** Skill editor payload. */
export interface SkillDetail extends SkillSummary {
    readonly prompt: string;
    readonly extraFiles: readonly string[];
}
/** Create or update expert fields. */
export interface ExpertSaveInput {
    readonly id?: string;
    readonly name: string;
    readonly avatar: string;
    readonly persona: string;
}
/** Create or update a skill under an expert. */
export interface SkillSaveInput {
    readonly name: string;
    readonly description: string;
    readonly prompt: string;
    readonly note?: string;
    /** Rename from this skill folder when set and different from `name`. */
    readonly fromName?: string;
}
/** Catalog file on disk. */
export interface CatalogFile {
    readonly revision: number;
    readonly experts: readonly string[];
}
/** Persisted expert meta.json. */
export interface ExpertMeta {
    readonly id: string;
    readonly name: string;
    readonly avatar: string;
    readonly persona: string;
}
