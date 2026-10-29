/** Optional Host bridge to `@woosau/dsh-custom-env` (`ctx.customEnv`). */
import type { Context } from '@deepseek-ai/cordis';
import type { ExpertEnvVar } from './types.ts';
/** Duck-typed subset of the custom-env Host service. */
export interface CustomEnvApi {
    setVar(name: string, value: string): Promise<void>;
    removeVar(name: string): Promise<boolean>;
}
/**
 * Look up custom-env when installed (O(1) Cordis store get; no I/O).
 * @param ctx - Host context.
 */
export declare function getCustomEnv(ctx: Context): CustomEnvApi | undefined;
/**
 * Require custom-env or throw a stable Client-localizable error.
 * @param ctx - Host context.
 */
export declare function requireCustomEnv(ctx: Context): CustomEnvApi;
/**
 * Whether custom-env is available on this Host.
 * @param ctx - Host context.
 */
export declare function customEnvAvailable(ctx: Context): boolean;
/**
 * Apply env entries to custom-env: set each, remove names no longer present.
 * @param api - custom-env service.
 * @param previous - prior declared names.
 * @param next - next declared entries.
 */
export declare function syncEnvToCustomEnv(api: CustomEnvApi, previous: readonly ExpertEnvVar[], next: readonly ExpertEnvVar[]): Promise<void>;
