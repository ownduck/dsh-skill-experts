/** Browser entry for skill experts. */
import type { Context } from '@deepseek-ai/cordis';
export { inject } from './mount.ts';
export type { ExpertsKey } from './locales.ts';
export type { ExpertsPanelInjected } from './ExpertsPanel.tsx';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Skill experts sidebar copy. */
        'skill-experts': import('./locales.ts').ExpertsKey;
    }
}
declare module '@deepseek-ai/dsh-api-remotes/client' {
    interface Remotes {
        skillExperts: {
            list(): Promise<{
                ok: true;
                value: import('../types.ts').ExpertSummary[];
            } | {
                ok: false;
                error: unknown;
            }>;
            get(id: string): Promise<{
                ok: true;
                value: import('../types.ts').ExpertDetail;
            } | {
                ok: false;
                error: unknown;
            }>;
            saveExpert(input: import('../types.ts').ExpertSaveInput): Promise<{
                ok: true;
                value: import('../types.ts').ExpertDetail;
            } | {
                ok: false;
                error: unknown;
            }>;
            deleteExpert(id: string): Promise<{
                ok: true;
                value: void;
            } | {
                ok: false;
                error: unknown;
            }>;
            getSkill(expertId: string, skillName: string): Promise<{
                ok: true;
                value: import('../types.ts').SkillDetail;
            } | {
                ok: false;
                error: unknown;
            }>;
            saveSkill(expertId: string, input: import('../types.ts').SkillSaveInput): Promise<{
                ok: true;
                value: import('../types.ts').SkillDetail;
            } | {
                ok: false;
                error: unknown;
            }>;
            deleteSkill(expertId: string, skillName: string): Promise<{
                ok: true;
                value: void;
            } | {
                ok: false;
                error: unknown;
            }>;
            importZip(expertId: string, zipBase64: string): Promise<{
                ok: true;
                value: {
                    imported: readonly string[];
                };
            } | {
                ok: false;
                error: unknown;
            }>;
        };
    }
}
/**
 * Mount the skill-experts sidebar and Remote methods.
 * @param ctx - browser plugin context.
 */
export declare function apply(ctx: Context): Promise<() => Promise<void>>;
