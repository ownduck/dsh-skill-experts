/** Parse and serialize SKILL.md (`name` + `description` frontmatter, body as prompt). */
export interface SkillFrontmatter {
    name: string;
    description: string;
}
export interface ParsedSkillMd {
    frontmatter: SkillFrontmatter;
    prompt: string;
    raw: string;
}
/**
 * Parse a SKILL.md body.
 * @param raw - file contents.
 * @param path - for errors.
 */
export declare function parseSkillMd(raw: string, path: string): ParsedSkillMd;
/**
 * Serialize skill fields to SKILL.md text.
 * @param fields - frontmatter + body.
 */
export declare function serializeSkillMd(fields: {
    name: string;
    description: string;
    prompt: string;
}): string;
