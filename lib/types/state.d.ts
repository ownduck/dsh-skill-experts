/** Enabled-expert preference under `$DSH_HOME/skill-experts/state.json`. */
/** On-disk enablement document. */
export interface ExpertsStateFile {
    readonly revision: number;
    readonly enabled: readonly string[];
}
/** @returns current enablement document. */
export declare function readState(): ExpertsStateFile;
/** @returns enabled expert ids as a Set. */
export declare function enabledSet(): Set<string>;
/**
 * Ensure every known expert has an enablement entry on first run.
 * Missing state enables all `knownIds` (backward compatible default).
 * @param knownIds - catalog expert ids.
 */
export declare function ensureState(knownIds: readonly string[]): ExpertsStateFile;
/**
 * Enable or disable one expert.
 * @param id - expert id.
 * @param enabled - desired state.
 * @param knownIds - catalog ids (drops orphan enable entries).
 */
export declare function setExpertEnabled(id: string, enabled: boolean, knownIds: readonly string[]): ExpertsStateFile;
/**
 * Drop an expert from the enablement list after deletion.
 * @param id - removed expert id.
 * @param knownIds - remaining catalog ids.
 */
export declare function forgetExpert(id: string, knownIds: readonly string[]): void;
/**
 * Enable a newly created expert.
 * @param id - new expert id.
 * @param knownIds - catalog ids including `id`.
 */
export declare function enableNewExpert(id: string, knownIds: readonly string[]): void;
