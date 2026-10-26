/** Disk catalog and expert/skill CRUD under `$DSH_HOME/skill-experts`. */
import type { ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput } from './types.ts';
declare function readMeta(id: string): ExpertMeta;
/** Ensure seed experts exist when catalog is missing. */
export declare function ensureSeeded(seedRoot?: any): void;
/** List expert summaries in catalog order. */
export declare function listExperts(): ExpertSummary[];
/** Load one expert. */
export declare function getExpert(id: string): ExpertDetail;
/** Create or update expert metadata. */
export declare function saveExpert(input: ExpertSaveInput): ExpertDetail;
/** Delete an expert and its files. */
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
