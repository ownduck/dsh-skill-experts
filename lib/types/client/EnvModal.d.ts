/** Expert env-var editor: row Confirm/Cancel for local checks; Save persists. */
import { type ReactNode } from 'react';
import type { ExpertEnvVar, ExpertSource } from '../types.ts';
import type { ExpertsKey } from './locales.ts';
type Translate = (key: ExpertsKey) => string;
export interface EnvModalProps {
    readonly t: Translate;
    readonly open: boolean;
    readonly expertId: string;
    readonly expertLabel: string;
    /** Built-in experts may only change values. */
    readonly source: ExpertSource;
    readonly getEnv: (id: string) => Promise<readonly ExpertEnvVar[]>;
    readonly customEnvStatus: () => Promise<{
        available: boolean;
    }>;
    readonly saveExpertEnv: (id: string, entries: readonly ExpertEnvVar[]) => Promise<void>;
    readonly busy: boolean;
    readonly setBusy: (value: boolean) => void;
    readonly onClose: () => void;
}
/** Expert environment variables modal. */
export declare function EnvModal(props: EnvModalProps): ReactNode;
export {};
