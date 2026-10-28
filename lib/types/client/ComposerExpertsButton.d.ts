/** Composer tool-row control: agency-style discovery popover for skill experts. */
import { type ReactNode } from 'react';
import type { ExpertsKey } from './locales.ts';
import { type ExpertReferenceInsert } from './composer-chip.ts';
export interface ComposerExpertRow {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly avatar: string;
    readonly enabled: boolean;
}
export interface ComposerExpertsButtonProps {
    readonly t: (key: ExpertsKey) => string;
    /** Sync peek of the last successful enabled list (may be empty before warm). */
    readonly peekEnabled: () => readonly ComposerExpertRow[];
    readonly listEnabled: () => Promise<readonly ComposerExpertRow[]>;
    readonly insertChip: (chip: ExpertReferenceInsert) => boolean;
    readonly getContinueChat: () => Promise<boolean>;
    readonly setContinueChat: (enabled: boolean) => Promise<boolean>;
}
/** Agency-style anchored discovery menu for inserting a skill-expert chip. */
export declare function ComposerExpertsButton(props: ComposerExpertsButtonProps): ReactNode;
