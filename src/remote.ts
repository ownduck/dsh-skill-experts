/**
 * Host Typert Remote for skill-expert CRUD.
 *
 * Loaded as a separate top-level Cordis row (`…/remote`) so api-gateway can
 * discover `skillExperts` from the root service table without waiting on tools
 * or other main-plugin injects — same layout as dsh-agency-agents.
 */

import type { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import {
  deleteExpert, deleteSkill, ensureSeeded, getExpert, getSkill, listExperts, saveExpert, saveSkill, setEnabled,
} from './catalog.ts'
import {
  getContinueChat as readContinueChat,
  setContinueChat as writeContinueChat,
} from './continue-mode.ts'
import { isSkillExpertsError, type SkillExpertsReason } from './errors.ts'
import { exportExpertZip, exportExpertsZip, importExpertZip } from './expert-zip.ts'
import { ExpertPresetSync } from './preset-sync.ts'
import type { ExpertDetail, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput } from './types.ts'
import { importSkillsZip } from './zip-import.ts'

export type {
  CatalogFile, ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput, SkillSummary,
} from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    skillExperts: SkillExpertsRemote
  }
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'skill-experts/not-found': { readonly id: string; readonly reason: string }
    'skill-experts/invalid': { readonly reason: string }
    'skill-experts/zip': { readonly reason: string }
  }
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function reasonOf(
  error: unknown,
  fallback: SkillExpertsReason | 'generic',
): string {
  if (isSkillExpertsError(error)) return error.reason
  return fallback
}

function wrap(
  error: unknown,
  code: 'skill-experts/not-found' | 'skill-experts/invalid' | 'skill-experts/zip',
  id: string,
): never {
  if (error instanceof RemoteError) throw error
  const message = asMessage(error)
  if (code === 'skill-experts/not-found') {
    throw new RemoteError(code, message, {
      id,
      reason: reasonOf(error, 'expert-not-found'),
    }, { cause: error })
  }
  if (code === 'skill-experts/zip') {
    throw new RemoteError(code, message, {
      reason: reasonOf(error, 'zip-invalid-layout'),
    }, { cause: error })
  }
  throw new RemoteError(code, message, {
    reason: reasonOf(error, 'generic'),
  }, { cause: error })
}

/** Lightweight Host remote: catalog CRUD + preset sync (never injects agentPresets). */
export default class SkillExpertsRemote extends TypertRemoteService {
  static inject = ['typert'] as const

  private readonly presets: ExpertPresetSync

  constructor(ctx: Context) {
    super(ctx, 'skillExperts')
    ensureSeeded()
    this.presets = new ExpertPresetSync(ctx)
    // Do not `ctx.inject(['agentPresets'])`: that would delay this remote row on
    // cold boot. Poll until the service exists, then sync once.
    ctx.effect(() => {
      let synced = false
      let timer: ReturnType<typeof setInterval> | undefined
      const trySync = (): void => {
        if (synced || ctx.get('agentPresets') === undefined) return
        synced = true
        if (timer !== undefined) clearInterval(timer)
        timer = undefined
        void this.presets.sync().catch(error => {
          ctx.logger.warn(`skill-experts: preset sync failed: ${asMessage(error)}`)
        })
      }
      timer = setInterval(trySync, 200)
      trySync()
      return () => {
        if (timer !== undefined) clearInterval(timer)
        void this.presets.dispose()
      }
    }, 'skill-experts: preset sync')
  }

  private async afterMutation<T>(run: () => T): Promise<T> {
    const value = run()
    await this.presets.sync()
    return value
  }

  /** @returns expert summaries including source and enablement. */
  @Remote('list')
  async list(): Promise<readonly ExpertSummary[]> {
    return listExperts()
  }

  /**
   * Whether continue-chat is on for this main session.
   * @param sessionId - durable parent session id.
   */
  @Remote('getContinueChat')
  async getContinueChat(sessionId: string): Promise<boolean> {
    return readContinueChat(String(sessionId ?? ''))
  }

  /**
   * Turn continue-chat on or off for this main session.
   * Turning off drops stored child-session pointers for that parent.
   * @param sessionId - durable parent session id.
   * @param enabled - desired preference.
   */
  @Remote('setContinueChat')
  async setContinueChat(sessionId: string, enabled: boolean): Promise<boolean> {
    return writeContinueChat(String(sessionId ?? ''), enabled === true)
  }

  /**
   * Enable or disable one expert.
   * @param id - expert id.
   * @param enabled - desired state.
   */
  @Remote('setEnabled')
  async setEnabled(id: string, enabled: boolean): Promise<ExpertDetail> {
    try {
      return await this.afterMutation(() => setEnabled(id, enabled))
    } catch (error) {
      wrap(error, 'skill-experts/not-found', id)
    }
  }

  /**
   * @param id - expert id.
   * @returns full expert detail.
   */
  @Remote('get')
  async get(id: string): Promise<ExpertDetail> {
    try {
      return getExpert(id)
    } catch (error) {
      wrap(error, 'skill-experts/not-found', id)
    }
  }

  /**
   * Create or update an expert.
   * @param input - expert fields.
   */
  @Remote('saveExpert')
  async saveExpert(input: ExpertSaveInput): Promise<ExpertDetail> {
    try {
      return await this.afterMutation(() => saveExpert(input))
    } catch (error) {
      wrap(error, 'skill-experts/invalid', input.id ?? '')
    }
  }

  /**
   * Delete an expert.
   * @param id - expert id.
   */
  @Remote('deleteExpert')
  async deleteExpert(id: string): Promise<void> {
    try {
      await this.afterMutation(() => {
        deleteExpert(id)
      })
    } catch (error) {
      wrap(error, 'skill-experts/not-found', id)
    }
  }

  /**
   * @param expertId - owner expert.
   * @param skillName - skill folder / name.
   */
  @Remote('getSkill')
  async getSkill(expertId: string, skillName: string): Promise<SkillDetail> {
    try {
      return getSkill(expertId, skillName)
    } catch (error) {
      wrap(error, 'skill-experts/not-found', `${expertId}/${skillName}`)
    }
  }

  /**
   * Create or update a skill.
   * @param expertId - owner expert.
   * @param input - skill fields.
   */
  @Remote('saveSkill')
  async saveSkill(expertId: string, input: SkillSaveInput): Promise<SkillDetail> {
    try {
      return await this.afterMutation(() => saveSkill(expertId, input))
    } catch (error) {
      wrap(error, 'skill-experts/invalid', expertId)
    }
  }

  /**
   * Delete a skill.
   * @param expertId - owner expert.
   * @param skillName - skill name.
   */
  @Remote('deleteSkill')
  async deleteSkill(expertId: string, skillName: string): Promise<void> {
    try {
      await this.afterMutation(() => {
        deleteSkill(expertId, skillName)
      })
    } catch (error) {
      wrap(error, 'skill-experts/not-found', `${expertId}/${skillName}`)
    }
  }

  /**
   * Import skills from a zip (base64).
   * @param expertId - owner expert.
   * @param zipBase64 - zip bytes as base64.
   */
  @Remote('importZip')
  async importZip(expertId: string, zipBase64: string): Promise<{ readonly imported: readonly string[] }> {
    try {
      getExpert(expertId)
      const bytes = Uint8Array.from(Buffer.from(zipBase64, 'base64'))
      const imported = await importSkillsZip(expertId, bytes)
      await this.presets.sync()
      return { imported }
    } catch (error) {
      wrap(error, 'skill-experts/zip', expertId)
    }
  }

  /**
   * Export one expert as a downloadable zip (base64).
   * @param id - expert id.
   */
  @Remote('exportExpert')
  async exportExpert(id: string): Promise<{ readonly filename: string; readonly zipBase64: string }> {
    try {
      const pack = await exportExpertZip(id)
      return {
        filename: pack.filename,
        zipBase64: Buffer.from(pack.bytes).toString('base64'),
      }
    } catch (error) {
      wrap(error, 'skill-experts/not-found', id)
    }
  }

  /**
   * Import an expert package zip (base64) as a new custom expert.
   * @param zipBase64 - zip bytes as base64.
   */
  @Remote('importExpert')
  async importExpert(zipBase64: string): Promise<{ readonly count: number; readonly ids: readonly string[] }> {
    try {
      const bytes = Uint8Array.from(Buffer.from(zipBase64, 'base64'))
      const result = await importExpertZip(bytes)
      await this.presets.sync()
      return result
    } catch (error) {
      wrap(error, 'skill-experts/zip', '')
    }
  }

  /**
   * Export several experts as one zip (base64).
   * @param ids - expert ids.
   */
  @Remote('exportExperts')
  async exportExperts(ids: readonly string[]): Promise<{ readonly filename: string; readonly zipBase64: string }> {
    try {
      const pack = await exportExpertsZip(ids)
      return {
        filename: pack.filename,
        zipBase64: Buffer.from(pack.bytes).toString('base64'),
      }
    } catch (error) {
      wrap(error, 'skill-experts/not-found', ids.join(','))
    }
  }
}
