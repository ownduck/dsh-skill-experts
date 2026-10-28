/** Composer button + @ mention source for skill-expert reference chips. */

import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { ComposerExpertsButton } from './ComposerExpertsButton.tsx'
import {
  buildExpertChip,
  EXPERT_CHIP_SOURCE,
  expertClipboardText,
  expertModelSerializeText,
  type ExpertReferenceInsert,
} from './composer-chip.ts'
import { NS, type ExpertsKey } from './locales.ts'
import type { ExpertSummary } from '../types.ts'

type Translate = (key: ExpertsKey) => string

type InputShell = {
  readonly snapshot: {
    readonly draft: string
    readonly draftRev: number
    readonly occurrences: readonly { readonly offset: number; readonly length: number }[]
  }
  insertReference(
    ref: ExpertReferenceInsert,
    span: { readonly start: number; readonly end: number; readonly draftRev: number },
  ): boolean
}

type SessionsFace = {
  list?: { getSnapshot: () => { current?: SessionId; byId?: Record<string, { id?: string }> } }
  scope?: (id: SessionId) => Context | undefined
  binding?: (id: SessionId) => { ctx: Context } | undefined
}

type ConversationFace = {
  input: { for: (actx: Context) => InputShell }
}

type InputTriggersFace = {
  registerSource: (source: {
    trigger: '@'
    name: string
    order?: number
    showGroupTitle?: boolean
    candidates: (
      session: { sessionId: SessionId },
      req: { query: string; signal: AbortSignal },
    ) => Promise<readonly {
      name: string
      label?: string
      description?: string
      hint?: string
      value?: string
      section?: string
    }[]>
    onPick: (pick: {
      candidate: { name: string; hint?: string; value?: string }
      session: { sessionId: SessionId }
    }) => { insert: ExpertReferenceInsert } | undefined
    warm?: (session: { sessionId: SessionId }) => void
    lexicon?: (session: { sessionId: SessionId }) => readonly string[] | undefined
    subscribeLexicon?: (session: { sessionId: SessionId }, listener: () => void) => () => void
    codec: {
      clipboardText: (ref: string) => string
      serialize: (ref: string, signal: AbortSignal) => Promise<string>
    }
  }) => () => void
}

/**
 * Resolve the session input shell for chip insertion (agency Ql pattern).
 * @param ctx - client root with sessions.
 * @param sessionId - slot inject session id when present.
 */
function resolveShell(ctx: Context, sessionId: SessionId | undefined): InputShell | undefined {
  const sessions = ctx.get('sessions') as SessionsFace | undefined
  if (sessions === undefined) return undefined
  const id = sessionId
    ?? sessions.list?.getSnapshot().current
    ?? (() => {
      const byId = sessions.list?.getSnapshot().byId
      if (byId === undefined) return undefined
      const entry = Object.entries(byId)[0]
      return entry?.[1]?.id ?? entry?.[0] as SessionId | undefined
    })()
  if (id === undefined) return undefined
  const actx = sessions.scope?.(id) ?? sessions.binding?.(id)?.ctx
  if (actx === undefined) return undefined
  const conversation = actx.get('conversation') as ConversationFace | undefined
  if (conversation === undefined) return undefined
  try {
    return conversation.input.for(actx)
  } catch {
    return undefined
  }
}

/**
 * Insert after leading chips (and one trailing space), matching agency `eu`/`tu`.
 * @param shell - session input facade.
 */
function spanAfterLeadingChips(shell: InputShell): {
  readonly start: number
  readonly end: number
  readonly draftRev: number
} {
  const snap = shell.snapshot
  let start = 0
  for (const occ of snap.occurrences) {
    if (occ.offset !== start) break
    start = occ.offset + occ.length
    const ch = snap.draft[start]
    if (ch === ' ' || ch === '\u00A0') start += 1
  }
  return { start, end: start, draftRev: snap.draftRev }
}

/**
 * Register composer left button and a bottom `@` group for skill experts.
 * @param ctx - client context (slots, locale, remote, inputTriggers, sessions).
 * @returns disposer.
 */
export function registerComposerExperts(ctx: Context): () => void {
  const t: Translate = key => ctx.locale.bind(NS)(key)
  let cache: readonly ExpertSummary[] = []
  const lexiconListeners = new Set<() => void>()

  const refresh = async (): Promise<readonly ExpertSummary[]> => {
    const remote = ctx.remote.skillExperts
    const result = await remote.list()
    if (!result.ok) throw result.error
    cache = result.value.filter(row => row.enabled)
    for (const listener of lexiconListeners) listener()
    return cache
  }

  const peekEnabled = () => cache

  const listEnabled = async () => {
    try {
      return await refresh()
    } catch {
      return cache
    }
  }

  const findCached = (id: string): ExpertSummary | undefined => (
    cache.find(row => row.id === id && row.enabled)
  )

  const insertIntoSession = (sessionId: SessionId | undefined, chip: ExpertReferenceInsert): boolean => {
    const shell = resolveShell(ctx, sessionId)
    if (shell === undefined) return false
    return shell.insertReference(chip, spanAfterLeadingChips(shell))
  }

  const disposeSlot = ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'skill-experts',
    order: 1,
    locale: NS,
    inject: (sessionId: SessionId) => ({
      t,
      peekEnabled,
      listEnabled,
      insertChip: (chip: ExpertReferenceInsert) => insertIntoSession(sessionId, chip),
      getContinueChat: async () => {
        const remote = ctx.remote.skillExperts
        const result = await remote.getContinueChat(String(sessionId))
        return result.ok && result.value === true
      },
      setContinueChat: async (enabled: boolean) => {
        const remote = ctx.remote.skillExperts
        const result = await remote.setContinueChat(String(sessionId), enabled)
        if (!result.ok) throw result.error
        return result.value === true
      },
    }),
  }, ComposerExpertsButton))

  const inputTriggers = ctx.get('inputTriggers') as InputTriggersFace | undefined
  let disposeSource: (() => void) | undefined
  if (inputTriggers !== undefined) {
    disposeSource = inputTriggers.registerSource({
      trigger: '@',
      name: EXPERT_CHIP_SOURCE,
      order: 200,
      showGroupTitle: false,
      async candidates(_session, req) {
        const enabled = await listEnabled()
        if (req.signal.aborted) return []
        const needle = String(req.query ?? '').toLowerCase()
        const section = t('composer.atSection')
        return enabled
          .filter(row => (
            needle === ''
            || `${row.name}\n${row.description}\n${row.id}`.toLowerCase().includes(needle)
          ))
          .map(row => ({
            name: row.name,
            hint: row.id,
            value: row.id,
            description: row.description,
            section,
          }))
      },
      onPick({ candidate }) {
        const id = candidate.value ?? candidate.hint ?? ''
        const expert = findCached(id)
        if (expert === undefined) return undefined
        return { insert: buildExpertChip(expert) }
      },
      warm() {
        void refresh().catch(() => undefined)
      },
      lexicon() {
        return cache.map(row => row.name)
      },
      subscribeLexicon(_session, listener) {
        lexiconListeners.add(listener)
        return () => { lexiconListeners.delete(listener) }
      },
      codec: {
        clipboardText(ref) {
          const expert = findCached(ref)
          if (expert === undefined) return `${t('composer.removed')}\u00A0`
          return expertClipboardText(expert.name)
        },
        async serialize(ref, signal) {
          signal.throwIfAborted()
          const enabled = await refresh()
          signal.throwIfAborted()
          const expert = enabled.find(row => row.id === ref)
          if (expert === undefined) throw new Error(t('composer.removed'))
          // Model text is stronger than the UI chip label: force summon_skill_expert.
          return expertModelSerializeText(expert)
        },
      },
    })
  }

  void refresh().catch(() => undefined)

  return () => {
    disposeSource?.()
    disposeSlot()
    lexiconListeners.clear()
  }
}
