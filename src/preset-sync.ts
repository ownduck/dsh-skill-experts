/** Keep `agentPresets` registrations in sync with the on-disk expert catalog. */

import type { Context } from '@deepseek-ai/cordis'
import type { PresetDefinition } from '@deepseek-ai/dsh-agent-preset-registry'
import { expertIds, getExpert } from './catalog.ts'
import { expertSkillsDir, presetIdFor } from './paths.ts'

type Disposer = () => Promise<void>

/**
 * Register or refresh every expert as an independent Agent Preset.
 * @param ctx - Host context with `agentPresets`.
 * @returns map of expert id → disposer; call `sync` again after catalog changes.
 */
export class ExpertPresetSync {
  private readonly disposers = new Map<string, Disposer>()

  constructor(private readonly ctx: Context) {}

  /** Rebuild registrations to match disk. */
  async sync(): Promise<void> {
    const presets = this.ctx.get('agentPresets')
    if (presets === undefined) {
      this.ctx.logger.warn('skill-experts: agentPresets service missing; expert presets not registered')
      return
    }
    const live = new Set(expertIds())
    for (const [id, dispose] of [...this.disposers]) {
      if (live.has(id)) continue
      this.disposers.delete(id)
      await dispose()
    }
    for (const id of live) {
      const definition = buildDefinition(id)
      const previous = this.disposers.get(id)
      if (previous !== undefined) {
        this.disposers.delete(id)
        await previous()
      }
      const dispose = await presets.register(definition)
      this.disposers.set(id, dispose)
    }
  }

  /** Unregister all expert presets. */
  async dispose(): Promise<void> {
    for (const [, dispose] of [...this.disposers]) await dispose()
    this.disposers.clear()
  }
}

function buildDefinition(expertId: string): PresetDefinition {
  const expert = getExpert(expertId)
  const skillsDir = expertSkillsDir(expertId)
  return {
    id: presetIdFor(expertId),
    name: expert.name,
    description: `Skill expert: ${expert.name}`,
    order: 100,
    plugins: [
      {
        id: 'persona',
        name: '@deepseek-ai/dsh-persona',
        config: {
          prefix: expert.persona,
          complete: true,
          includeRuntimeContext: false,
        },
      },
      {
        id: 'tool-fs',
        name: '@deepseek-ai/dsh-tool-fs',
        config: { read: true, readImage: true, write: false, edit: false },
      },
      {
        id: 'skill-filesystem',
        name: '@deepseek-ai/dsh-skill-filesystem',
        config: {
          includeDefaultRoots: false,
          customSkillDirs: [skillsDir],
        },
      },
      {
        id: 'tool-skill',
        name: '@deepseek-ai/dsh-tool-skill',
      },
    ],
  }
}
