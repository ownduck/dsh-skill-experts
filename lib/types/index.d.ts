/**
 * Host service: skill-expert catalog, preset sync, and summon tools.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { ExpertDetail, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput } from './types.ts';
export type { CatalogFile, ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput, SkillSummary, } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        skillExperts: SkillExpertsController;
    }
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        'skill-experts/not-found': {
            readonly id: string;
        };
        'skill-experts/invalid': {
            readonly reason: string;
        };
        'skill-experts/zip': {
            readonly reason: string;
        };
    }
}
/** Host remote + summon registration for skill experts. */
export default class SkillExpertsController extends TypertRemoteService {
    static inject: string[];
    private readonly presets;
    private readonly disposeSummon;
    constructor(ctx: Context);
    private afterMutation;
    /** @returns expert summaries. */
    list(): Promise<readonly ExpertSummary[]>;
    /**
     * @param id - expert id.
     * @returns full expert detail.
     */
    get(id: string): Promise<ExpertDetail>;
    /**
     * Create or update an expert.
     * @param input - expert fields.
     */
    saveExpert(input: ExpertSaveInput): Promise<ExpertDetail>;
    /**
     * Delete an expert.
     * @param id - expert id.
     */
    deleteExpert(id: string): Promise<void>;
    /**
     * @param expertId - owner expert.
     * @param skillName - skill folder / name.
     */
    getSkill(expertId: string, skillName: string): Promise<SkillDetail>;
    /**
     * Create or update a skill.
     * @param expertId - owner expert.
     * @param input - skill fields.
     */
    saveSkill(expertId: string, input: SkillSaveInput): Promise<SkillDetail>;
    /**
     * Delete a skill.
     * @param expertId - owner expert.
     * @param skillName - skill name.
     */
    deleteSkill(expertId: string, skillName: string): Promise<void>;
    /**
     * Import skills from a zip (base64).
     * @param expertId - owner expert.
     * @param zipBase64 - zip bytes as base64.
     */
    importZip(expertId: string, zipBase64: string): Promise<{
        readonly imported: readonly string[];
    }>;
}
