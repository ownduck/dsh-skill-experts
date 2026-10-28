/** Disk catalog and expert/skill CRUD under `$DSH_HOME/skill-experts`. */
import type { ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput } from './types.ts';
declare function readMeta(id: string): ExpertMeta;
/**
 * Ensure seed experts exist and stamp builtin / enablement defaults.
 * Missing seeds are copied into `$DSH_HOME` (fill-if-absent); existing local
 * copies are never overwritten. Plugin upgrades that add new seed folders
 * therefore deploy on the next Host load even when catalog.json already exists.
 * @param seedRoot - package `assets/seed` directory.
 */
export declare function ensureSeeded(seedRoot?: any): void;
/**
 * List expert summaries: built-ins first (catalog-relative order), then
 * customs in creation / catalog-append order.
 */
export declare function listExperts(): ExpertSummary[];
/** Load one expert. */
export declare function getExpert(id: string): ExpertDetail;
/**
 * Enable or disable one expert.
 * @param id - expert id.
 * @param enabled - desired state.
 */
export declare function setEnabled(id: string, enabled: boolean): ExpertDetail;
/** Create or update expert metadata. */
export declare function saveExpert(input: ExpertSaveInput): ExpertDetail;
/** Delete a custom expert and its files. Built-in experts cannot be removed. */
export declare function deleteExpert(id: string): void;
/** Load skill editor payload. */
export declare function getSkill(expertId: string, skillName: string): SkillDetail;
/** Create or update a skill. */
export declare function saveSkill(expertId: string, input: SkillSaveInput): SkillDetail;
/** Delete one skill folder. */
export declare function deleteSkill(expertId: string, skillName: string): void;
/** All expert ids currently on disk (catalog). */
export declare function expertIds(): readonly string[];
export { readMeta };
