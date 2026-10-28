/**
 * Host Typert Remote for skill-expert CRUD.
 *
 * Loaded as a separate top-level Cordis row (`…/remote`) so api-gateway can
 * discover `skillExperts` from the root service table without waiting on tools
 * or other main-plugin injects — same layout as dsh-agency-agents.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { ExpertDetail, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput } from './types.ts';
export type { CatalogFile, ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput, SkillSummary, } from './types.ts';
declare module '@deepseek-ai/cordis' {
    interface Context {
        skillExperts: SkillExpertsRemote;
    }
}
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface RemoteErrorDetailsMap {
        'skill-experts/not-found': {
            readonly id: string;
            readonly reason: string;
        };
        'skill-experts/invalid': {
            readonly reason: string;
        };
        'skill-experts/zip': {
            readonly reason: string;
        };
    }
}
/** Lightweight Host remote: catalog CRUD + preset sync (never injects agentPresets). */
export default class SkillExpertsRemote extends TypertRemoteService {
    static inject: readonly ["typert"];
    private readonly presets;
    constructor(ctx: Context);
    private afterMutation;
    /** @returns expert summaries including source and enablement. */
    list(): Promise<readonly ExpertSummary[]>;
    /**
     * Whether continue-chat is on for this main session.
     * @param sessionId - durable parent session id.
     */
    getContinueChat(sessionId: string): Promise<boolean>;
    /**
     * Turn continue-chat on or off for this main session.
     * Turning off drops stored child-session pointers for that parent.
     * @param sessionId - durable parent session id.
     * @param enabled - desired preference.
     */
    setContinueChat(sessionId: string, enabled: boolean): Promise<boolean>;
    /**
     * Enable or disable one expert.
     * @param id - expert id.
     * @param enabled - desired state.
     */
    setEnabled(id: string, enabled: boolean): Promise<ExpertDetail>;
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
    /**
     * Export one expert as a downloadable zip (base64).
     * @param id - expert id.
     */
    exportExpert(id: string): Promise<{
        readonly filename: string;
        readonly zipBase64: string;
    }>;
    /**
     * Import an expert package zip (base64) as a new custom expert.
     * @param zipBase64 - zip bytes as base64.
     */
    importExpert(zipBase64: string): Promise<{
        readonly count: number;
        readonly ids: readonly string[];
    }>;
    /**
     * Export several experts as one zip (base64).
     * @param ids - expert ids.
     */
    exportExperts(ids: readonly string[]): Promise<{
        readonly filename: string;
        readonly zipBase64: string;
    }>;
}
