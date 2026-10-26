/** Keep `agentPresets` registrations in sync with the on-disk expert catalog. */
import type { Context } from '@deepseek-ai/cordis';
/**
 * Register or refresh every expert as an independent Agent Preset.
 * @param ctx - Host context with `agentPresets`.
 * @returns map of expert id → disposer; call `sync` again after catalog changes.
 */
export declare class ExpertPresetSync {
    private readonly ctx;
    private readonly disposers;
    constructor(ctx: Context);
    /** Rebuild registrations to match disk. */
    sync(): Promise<void>;
    /** Unregister all expert presets. */
    dispose(): Promise<void>;
}
