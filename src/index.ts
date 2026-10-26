/**
 * Host service: skill-expert catalog, preset sync, and summon tools.
 */

import type { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import {
  deleteExpert, deleteSkill, ensureSeeded, getExpert, getSkill, listExperts, saveExpert, saveSkill,
} from './catalog.ts'
import { ExpertPresetSync } from './preset-sync.ts'
import { registerSummonTools } from './summon.ts'
import type { ExpertDetail, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput } from './types.ts'
import { importSkillsZip } from './zip-import.ts'

export type {
  CatalogFile, ExpertDetail, ExpertMeta, ExpertSaveInput, ExpertSummary, SkillDetail, SkillSaveInput, SkillSummary,
} from './types.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    skillExperts: SkillExpertsController
  }
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface RemoteErrorDetailsMap {
    'skill-experts/not-found': { readonly id: string }
    'skill-experts/invalid': { readonly reason: string }
    'skill-experts/zip': { readonly reason: string }
  }
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function wrap(error: unknown, code: 'skill-experts/not-found' | 'skill-experts/invalid' | 'skill-experts/zip', id: string): never {
  if (error instanceof RemoteError) throw error
  const message = asMessage(error)
  if (code === 'skill-experts/not-found') {
    throw new RemoteError(code, message, { id }, { cause: error })
  }
  if (code === 'skill-experts/zip') {
    throw new RemoteError(code, message, { reason: message }, { cause: error })
  }
  throw new RemoteError(code, message, { reason: message }, { cause: error })
}

/** Host remote + summon registration for skill experts. */
export default class SkillExpertsController extends TypertRemoteService {
  static inject = ['tools', 'systemPrompt']

  private readonly presets: ExpertPresetSync
  private readonly disposeSummon: () => void

  constructor(ctx: Context) {
    super(ctx, 'skillExperts')
    ensureSeeded()
    this.presets = new ExpertPresetSync(ctx)
    this.disposeSummon = registerSummonTools(ctx)
    ctx.effect(() => () => {
      this.disposeSummon()
      void this.presets.dispose()
    }, 'skill-experts: cleanup')
    void this.presets.sync().catch(error => {
      ctx.logger.warn(`skill-experts: initial preset sync failed: ${asMessage(error)}`)
    })
  }

  private async afterMutation<T>(run: () => T): Promise<T> {
    const value = run()
    await this.presets.sync()
    return value
  }

  /** @returns expert summaries. */
  @Remote('list')
  async list(): Promise<readonly ExpertSummary[]> {
    return listExperts()
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
}
