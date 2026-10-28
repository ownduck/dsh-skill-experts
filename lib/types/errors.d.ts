/** Stable failure reasons for skill-experts Host → Client localization. */
/** Reason tokens written into RemoteError details and mapped by Client dictionaries. */
export type SkillExpertsReason = 'expert-not-found' | 'name-required' | 'persona-required' | 'builtin-cannot-delete' | 'builtin-cannot-delete-skill' | 'builtin-cannot-add-skill' | 'builtin-cannot-import-skill' | 'skill-name-required' | 'skill-name-kebab' | 'skill-description-required' | 'skill-prompt-required' | 'skill-not-found' | 'skill-exists' | 'zip-empty' | 'zip-invalid-layout' | 'zip-missing-skill-md' | 'zip-missing-meta';
/** Host-side failure carrying a stable reason; English message is diagnostic only. */
export declare class SkillExpertsError extends Error {
    readonly reason: SkillExpertsReason;
    readonly name = "SkillExpertsError";
    /**
     * @param reason - stable token for Client `error.<reason>` lookup.
     * @param message - English diagnostic for logs / RemoteError.message.
     */
    constructor(reason: SkillExpertsReason, message: string);
}
/** Type guard for {@link SkillExpertsError}. */
export declare function isSkillExpertsError(value: unknown): value is SkillExpertsError;
