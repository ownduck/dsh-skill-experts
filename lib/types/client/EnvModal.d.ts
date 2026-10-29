/** Expert env-var editor: draft Confirm/Cancel per row, syncs via custom-env. */
import { type ReactNode } from 'react';
import type { ExpertEnvVar } from '../types.ts';
import type { ExpertsKey } from './locales.ts';
type Translate = (key: ExpertsKey) => string;
export interface EnvModalProps {
    readonly t: Translate;
    readonly open: boolean;
    readonly expertId: string;
    readonly expertLabel: string;
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
