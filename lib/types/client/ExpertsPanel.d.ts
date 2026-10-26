/** Main panel: expert list, editor, skill table / editor, zip import. */
import { type ReactNode } from 'react';
import type { ExpertDetail, ExpertSummary, SkillDetail } from '../types.ts';
import type { ExpertsKey } from './locales.ts';
export interface ExpertsPanelInjected {
    readonly t: (key: ExpertsKey) => string;
    readonly list: () => Promise<readonly ExpertSummary[]>;
    readonly get: (id: string) => Promise<ExpertDetail>;
    readonly saveExpert: (input: {
        id?: string;
        name: string;
        avatar: string;
        persona: string;
    }) => Promise<ExpertDetail>;
    readonly deleteExpert: (id: string) => Promise<void>;
    readonly getSkill: (expertId: string, skillName: string) => Promise<SkillDetail>;
    readonly saveSkill: (expertId: string, input: {
        name: string;
        description: string;
        prompt: string;
        note?: string;
        fromName?: string;
    }) => Promise<SkillDetail>;
    readonly deleteSkill: (expertId: string, skillName: string) => Promise<void>;
    readonly importZip: (expertId: string, zipBase64: string) => Promise<{
        imported: readonly string[];
    }>;
}
/** Skill experts management panel. */
export declare function ExpertsPanel({ t, list, get, saveExpert, deleteExpert, getSkill, saveSkill, deleteSkill, importZip }: ExpertsPanelInjected): ReactNode;
