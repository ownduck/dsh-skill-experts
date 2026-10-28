/** Resolve skill-experts storage under `$DSH_HOME`. */
/** Root directory for all skill experts. */
export declare function expertsRoot(): string;
/** Catalog JSON path. */
export declare function catalogPath(): string;
/** Enablement preferences JSON path. */
export declare function statePath(): string;
/** Per-parent continue-chat preference and child-session map. */
export declare function continuePath(): string;
/** One expert directory. */
export declare function expertDir(id: string): string;
/** Expert meta.json path. */
export declare function expertMetaPath(id: string): string;
/** Skills root for one expert. */
export declare function expertSkillsDir(id: string): string;
/** One skill directory. */
export declare function skillDir(expertId: string, skillName: string): string;
/** SKILL.md path. */
export declare function skillMdPath(expertId: string, skillName: string): string;
/** Registry preset id for an expert. */
export declare function presetIdFor(expertId: string): string;
/** Kebab-case skill / expert id check (DSH skill name rules). */
export declare function isKebabName(value: string): boolean;
