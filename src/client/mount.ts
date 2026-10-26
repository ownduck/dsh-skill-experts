/** Mount Remote contribution and the sidebar main panel. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type { TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { ExpertsIcon } from './ExpertsIcon.tsx'
import { ExpertsPanel, type ExpertsPanelInjected } from './ExpertsPanel.tsx'
import { en, NS, zh } from './locales.ts'

export const inject = ['remote', 'slots', 'locale'] as const

const PANEL_ID = 'skill-experts' as MainPanelId

function registerUi(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'skill-experts: dictionaries')
  const t = ctx.locale.bind(NS)
  const call = async <T>(result: { ok: true; value: T } | { ok: false; error: unknown }): Promise<T> => {
    if (!result.ok) throw result.error
    return result.value
  }

  const injectPanel = (): ExpertsPanelInjected => {
    const remote = ctx.remote.skillExperts
    return {
      t: key => t(key),
      list: async () => call(await remote.list()),
      get: async id => call(await remote.get(id)),
      saveExpert: async input => call(await remote.saveExpert(input)),
      deleteExpert: async id => call(await remote.deleteExpert(id)),
      getSkill: async (expertId, skillName) => call(await remote.getSkill(expertId, skillName)),
      saveSkill: async (expertId, input) => call(await remote.saveSkill(expertId, input)),
      deleteSkill: async (expertId, skillName) => call(await remote.deleteSkill(expertId, skillName)),
      importZip: async (expertId, zipBase64) => call(await remote.importZip(expertId, zipBase64)),
    }
  }

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    inject: injectPanel,
  }, ExpertsPanel))

  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 5,
    locale: NS,
    label: () => t('panel'),
  }, ExpertsIcon))
}

/**
 * Mount the skill-experts Remote and sidebar UI.
 * @param ctx - Client plugin lifetime.
 * @param contribution - generated controller Remote definitions.
 */
export async function mountSkillExperts(
  ctx: Context,
  contribution: TypertRemoteContribution,
): Promise<() => Promise<void>> {
  const unmountRemote = await ctx.remote.$mount(contribution)
  const ui = ctx.inject(['remote.skillExperts', 'slots', 'locale'], child => registerUi(child))
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await unmountRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await unmountRemote()
  }
}
