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
import { registerComposerExperts } from './register-composer.ts'

export const inject = ['remote', 'slots', 'locale'] as const

const PANEL_ID = 'skill-experts' as MainPanelId

function registerSidebar(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'skill-experts: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 5,
    locale: NS,
    label: () => t('panel.title'),
  }, ExpertsIcon))
}

function registerMainPanel(ctx: Context): void {
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
      setEnabled: async (id, enabled) => call(await remote.setEnabled(id, enabled)),
      getSkill: async (expertId, skillName) => call(await remote.getSkill(expertId, skillName)),
      saveSkill: async (expertId, input) => call(await remote.saveSkill(expertId, input)),
      deleteSkill: async (expertId, skillName) => call(await remote.deleteSkill(expertId, skillName)),
      importZip: async (expertId, zipBase64) => call(await remote.importZip(expertId, zipBase64)),
      exportExpert: async id => call(await remote.exportExpert(id)),
      exportExperts: async ids => call(await remote.exportExperts(ids)),
      importExpert: async zipBase64 => call(await remote.importExpert(zipBase64)),
      customEnvStatus: async () => call(await remote.customEnvStatus()),
      saveExpertEnv: async (id, entries) => call(await remote.saveExpertEnv(id, entries)),
    }
  }
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    inject: injectPanel,
  }, ExpertsPanel))
}

function registerComposer(ctx: Context): void {
  ctx.effect(() => registerComposerExperts(ctx), 'skill-experts: composer')
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
  // Sidebar must not wait on Host. Main panel waits for remote.skillExperts, but
  // do not await it — awaiting blocks client boot when Host activation is delayed.
  const sidebar = ctx.inject(['slots', 'locale'], child => registerSidebar(child))
  const main = ctx.inject(['remote.skillExperts', 'slots', 'locale'], child => registerMainPanel(child))
  const composer = ctx.inject(
    ['remote.skillExperts', 'slots', 'locale', 'inputTriggers', 'sessions'],
    child => registerComposer(child),
  )
  try {
    await sidebar
  } catch (error) {
    await composer.dispose()
    await main.dispose()
    await sidebar.dispose()
    await unmountRemote()
    throw error
  }
  return async () => {
    await composer.dispose()
    await main.dispose()
    await sidebar.dispose()
    await unmountRemote()
  }
}
