/** Export / import skill experts as zip packages (single or batch). */
import type { Context } from '@deepseek-ai/cordis';
import { exportSlug } from './export-slug.ts';
export interface ExpertZipExport {
    readonly filename: string;
    readonly bytes: Uint8Array;
}
export interface ExpertZipImportResult {
    readonly count: number;
    readonly ids: readonly string[];
}
/**
 * Pack one expert: root `meta.json` + `skills/<name>/…`.
 * @param id - expert id on disk.
 */
export declare function exportExpertZip(id: string): Promise<ExpertZipExport>;
/**
 * Pack many experts: each under `{slug}/meta.json` + `skills/…`.
 * @param ids - expert ids (order preserved when possible).
 */
export declare function exportExpertsZip(ids: readonly string[]): Promise<ExpertZipExport>;
/**
 * Import a single-expert or multi-expert zip as new custom experts.
 * @param ctx - Host context (required when the zip declares envVars).
 * @param bytes - zip contents.
 */
export declare function importExpertZip(ctx: Context, bytes: Uint8Array): Promise<ExpertZipImportResult>;
export { exportSlug };
