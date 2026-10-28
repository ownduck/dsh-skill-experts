/** Per-parent continue-chat preference and expertId → childSessionId map. */
/** One parent session's continue preference and child pointers. */
export interface ContinueParentEntry {
    readonly continue: boolean;
    readonly children: Readonly<Record<string, string>>;
}
/** On-disk continue document keyed by parent session id. */
export interface ContinueFile {
    readonly revision: number;
    readonly byParent: Readonly<Record<string, ContinueParentEntry>>;
}
/**
 * Whether continue-chat is enabled for this parent session.
 * @param parentSessionId - durable main session id.
 */
export declare function getContinueChat(parentSessionId: string): boolean;
/**
 * Enable or disable continue-chat for a parent session.
 * Turning off keeps child pointers so a later turn-on can resume the last child.
 * @param parentSessionId - durable main session id.
 * @param enabled - desired preference.
 * @returns the stored preference.
 */
export declare function setContinueChat(parentSessionId: string, enabled: boolean): boolean;
/**
 * Look up the mapped child session id for one expert under a parent.
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id (not display name).
 */
export declare function getChildId(parentSessionId: string, expertId: string): string | undefined;
/**
 * Persist expertId → childSessionId for a parent.
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id.
 * @param childSessionId - continuable child session id.
 */
export declare function setChildId(parentSessionId: string, expertId: string, childSessionId: string): void;
/**
 * Drop one expert's child pointer (e.g. after a failed cold resume).
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id.
 */
export declare function clearChildId(parentSessionId: string, expertId: string): void;
/**
 * Clear every child pointer for a parent (used when turning continue off).
 * @param parentSessionId - durable main session id.
 */
export declare function clearChildren(parentSessionId: string): void;
/** Catalog row used for label fallback discovery. */
export interface ContinuableChildHint {
    readonly id: string;
    readonly mode: string;
    readonly label?: string;
    readonly createdAt?: number;
}
/**
 * Resolve a child session id: disk map first, then newest continuable child
 * whose label matches the expert display name.
 * @param parentSessionId - durable main session id.
 * @param expertId - stable expert id for the disk key.
 * @param expertName - display name used only for listChildren fallback.
 * @param children - optional catalog rows from `subagents.listChildren`.
 */
export declare function resolveChildId(parentSessionId: string, expertId: string, expertName: string, children?: readonly ContinuableChildHint[]): string | undefined;
