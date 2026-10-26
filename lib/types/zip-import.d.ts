/** Validate and import skill zip archives into an expert's skills directory. */
/**
 * Import one or more skills from a zip buffer.
 * @param expertId - target expert.
 * @param bytes - zip contents.
 * @returns imported skill names.
 */
export declare function importSkillsZip(expertId: string, bytes: Uint8Array): Promise<string[]>;
