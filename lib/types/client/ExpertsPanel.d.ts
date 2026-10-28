/** Main panel: expert list with edit / skills / skill-editor modals. */
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
        description: string;
        avatar: string;
        persona: string;
    }) => Promise<ExpertDetail>;
    readonly deleteExpert: (id: string) => Promise<void>;
    readonly setEnabled: (id: string, enabled: boolean) => Promise<ExpertDetail>;
    readonly getSkill: (expertId: string, skillName: string) => Promise<SkillDetail>;
    readonly saveSkill: (expertId: string, input: {
        name: string;
        description: string;
        prompt: string;
        fromName?: string;
    }) => Promise<SkillDetail>;
    readonly deleteSkill: (expertId: string, skillName: string) => Promise<void>;
    readonly importZip: (expertId: string, zipBase64: string) => Promise<{
        imported: readonly string[];
    }>;
    readonly exportExpert: (id: string) => Promise<{
        filename: string;
        zipBase64: string;
    }>;
    readonly exportExperts: (ids: readonly string[]) => Promise<{
        filename: string;
        zipBase64: string;
    }>;
    readonly importExpert: (zipBase64: string) => Promise<{
        count: number;
        ids: readonly string[];
    }>;
}
export declare function ExpertsPanel({ t, list, get, saveExpert, deleteExpert, setEnabled, getSkill, saveSkill, deleteSkill, importZip, exportExpert, exportExperts, importExpert, }: ExpertsPanelInjected): ReactNode;
