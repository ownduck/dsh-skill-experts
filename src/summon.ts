/** Model tools: list and summon skill experts as spawn subagents (agency-style await). */

import type { Context } from '@deepseek-ai/cordis'
import { getExpert, listExperts } from './catalog.ts'
import {
  clearChildId,
  getContinueChat,
  resolveChildId,
  setChildId,
  type ContinuableChildHint,
} from './continue-mode.ts'
import { presetIdFor } from './paths.ts'

const LIST = 'list_skill_experts'
const SUMMON = 'summon_skill_expert'

type ContentBlock = { readonly type: string; readonly text?: string }

type SubagentResult = {
  readonly stopReason: string
  readonly output: readonly ContentBlock[]
}

type SubagentActivation = {
  readonly childId: string
  readonly result: Promise<SubagentResult>
  readonly dispose: () => Promise<unknown> | unknown
}

type SubagentEndInfo = {
  readonly id: string
  readonly stopReason: string
  readonly lastAssistantMessage?: readonly ContentBlock[]
}

type SubagentsService = {
  startActivation: (request: {
    provider: string
    label: string
    delivery: 'caller' | 'parent'
    signal: AbortSignal
    request: {
      parent: unknown
      prompt: readonly ContentBlock[]
      agentPreset: string
    }
  }) => Promise<SubagentActivation>
  sendMessage?: (
    sender: unknown,
    targetId: string,
    content: readonly ContentBlock[],
    options: { signal: AbortSignal },
  ) => Promise<string>
  listChildren?: (parentSessionId: string, signal?: AbortSignal) => Promise<readonly ContinuableChildHint[]>
}

/**
 * Concatenate text blocks from a subagent result (agency `textBlocks`).
 * @param blocks - child output blocks.
 */
function textBlocks(blocks: readonly ContentBlock[]): string {
  return blocks
    .filter(block => block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text ?? '')
    .join('')
}

/**
 * Await an activation the way agency does: race abort, then always dispose.
 * @param run - activation handle from `startActivation`.
 * @param signal - tool abort signal.
 */
async function awaitActivation(run: SubagentActivation, signal: AbortSignal): Promise<SubagentResult> {
  let disposal: Promise<unknown> | undefined
  const dispose = () => {
    if (disposal === undefined) {
      try {
        disposal = Promise.resolve(run.dispose())
      } catch (error) {
        disposal = Promise.reject(error)
      }
    }
    return disposal
  }

  let rejectAborted!: (reason: unknown) => void
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAborted = reject
  })
  const onAbort = () => {
    void dispose().catch(() => undefined)
    rejectAborted(signal.reason ?? new Error('aborted'))
  }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    if (signal.aborted) {
      onAbort()
      await dispose()
      throw signal.reason ?? new Error('aborted')
    }
    return await Promise.race([run.result, aborted])
  } finally {
    signal.removeEventListener('abort', onAbort)
    await dispose()
  }
}

/**
 * Wait for one child's activation epoch to end after sendMessage.
 * @param ctx - Host context emitting `subagent/end`.
 * @param childId - durable child session id.
 * @param signal - tool abort signal.
 */
function awaitSubagentEnd(ctx: Context, childId: string, signal: AbortSignal): Promise<SubagentResult> {
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (error: unknown | undefined, result?: SubagentResult) => {
      if (settled) return
      settled = true
      signal.removeEventListener('abort', onAbort)
      disposeListen()
      if (error !== undefined) reject(error)
      else resolve(result ?? { output: [], stopReason: 'error' })
    }
    const onAbort = () => {
      finish(signal.reason ?? new Error('aborted'))
    }
    const disposeListen = ctx.on('subagent/end', (info: SubagentEndInfo) => {
      if (info.id !== childId) return
      finish(undefined, {
        stopReason: info.stopReason,
        output: info.lastAssistantMessage ?? [],
      })
    })
    signal.addEventListener('abort', onAbort, { once: true })
    if (signal.aborted) onAbort()
  })
}

/**
 * Build the task prompt blocks for a skill expert.
 * @param expertName - display name.
 * @param task - short brief from the parent.
 */
function expertPrompt(expertName: string, task: string): ContentBlock[] {
  return [{
    type: 'text' as const,
    text: [
      `You are the skill expert "${expertName}".`,
      'Follow your persona and use your available skills as needed.',
      '',
      '## Task',
      task,
    ].join('\n'),
  }]
}

/**
 * Map a settled result to the summon tool payload or throw.
 * @param expertName - display name for errors.
 * @param result - child terminal result.
 */
function answerFromResult(expertName: string, result: SubagentResult): { expert: string; answer: string } {
  const answer = textBlocks(result.output).trim()
  if (result.stopReason !== 'completed') {
    const detailText = answer.length > 0 ? ` Partial output:\n${answer}` : ''
    throw new Error(`skill expert "${expertName}" ended with ${result.stopReason}.${detailText}`)
  }
  if (answer === '') {
    throw new Error(`skill expert "${expertName}" returned no usable text`)
  }
  return { expert: expertName, answer }
}

/**
 * Register list/summon tools and system-prompt guidance (agency-style).
 * Avoid importing `@deepseek-ai/dsh-tools`: linked installs resolve from the
 * package realpath and cannot see Host-bundled DSH packages beyond the peers
 * the Loader already exposes (typert / home-paths).
 * @param ctx - Host context with tools / subagents / systemPrompt.
 * @returns disposer.
 */
export function registerSummonTools(ctx: Context): () => void {
  const listTool = {
    name: LIST,
    description:
      'List enabled skill experts managed by dsh-skill-experts '
      + '(id, name, avatar, skillCount, presetId, source). '
      + 'Call this before summon_skill_expert only when the user did not name an expert. '
      + 'Do not use the generic subagent tool for these experts.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          experts: { type: 'array', items: {} },
        },
        required: ['experts'],
      },
      render: (_args: unknown, value: unknown) => [{
        type: 'text' as const,
        text: JSON.stringify(value, undefined, 2),
      }],
    },
    async execute() {
      return { experts: listExperts().filter(row => row.enabled) }
    },
  }

  const summonTool = {
    name: SUMMON,
    description:
      'Summon one skill expert as a spawn subagent with that expert\'s Agent Preset '
      + '(persona + isolated skills) and return its answer to the parent. '
      + 'If the user message contains a skill-expert chip or @DisplayName for this expert, '
      + 'you MUST call this immediately (once per named expert). '
      + 'Do not greet or answer that @ mention yourself first. '
      + 'Pass a short task brief from the remaining user text. '
      + 'When continue-chat is on for this session, the same expert reuses its prior child. '
      + 'Do not use the generic subagent tool for skill experts.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        expert: {
          type: 'string',
          description: 'Expert id or exact display name from list_skill_experts.',
        },
        task: {
          type: 'string',
          description:
            'Short brief from the user message after the expert chip: goal, constraints, '
            + 'and relevant paths. Do not paste large source dumps. Even a short greeting '
            + 'or question is a valid task.',
        },
      },
      required: ['expert', 'task'],
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          expert: { type: 'string' },
          answer: { type: 'string' },
        },
        required: ['expert', 'answer'],
      },
      render: (_args: unknown, value: { answer: string }) => [{
        type: 'text' as const,
        text: value.answer,
      }],
    },
    isConcurrencySafe: () => true,
    async execute(args: { expert?: string; task?: string }, exec: {
      agent?: { id: string; session: { header: { parentSession?: unknown } } }
      signal: AbortSignal
    }) {
      const agent = exec.agent
      if (agent === undefined) throw new Error('summon_skill_expert requires a calling agent')
      if (agent.session.header.parentSession !== undefined) {
        throw new Error('skill experts cannot summon further skill experts')
      }
      const expertKey = String(args.expert ?? '').trim()
      const task = String(args.task ?? '').trim()
      if (expertKey === '' || task === '') throw new Error('expert and task are required')

      const roster = listExperts().filter(row => row.enabled)
      const match = roster.find(row => row.id === expertKey || row.name === expertKey)
      if (match === undefined) {
        throw new Error(`unknown or disabled skill expert "${expertKey}"; call list_skill_experts first`)
      }
      const detail = getExpert(match.id)
      const subagents = ctx.get('subagents') as SubagentsService | undefined
      if (subagents === undefined) throw new Error('subagents service unavailable')
      if (typeof subagents.startActivation !== 'function') {
        throw new Error('subagents.startActivation unavailable')
      }

      const prompt = expertPrompt(detail.name, task)
      const parentId = String(agent.id)
      const continueOn = getContinueChat(parentId)

      const startFresh = async (): Promise<{ expert: string; answer: string }> => {
        const started = await subagents.startActivation({
          provider: 'spawn',
          label: detail.name,
          delivery: 'caller',
          signal: exec.signal,
          request: {
            parent: agent,
            prompt,
            agentPreset: presetIdFor(detail.id),
          },
        })
        // Always record the child used this turn so toggling continue back on
        // can resume the latest spawn for this expert.
        setChildId(parentId, detail.id, started.childId)
        const result = await awaitActivation(started, exec.signal)
        return answerFromResult(detail.name, result)
      }

      if (continueOn && typeof subagents.sendMessage === 'function') {
        let catalog: readonly ContinuableChildHint[] | undefined
        if (typeof subagents.listChildren === 'function') {
          try {
            catalog = await subagents.listChildren(parentId, exec.signal)
          } catch {
            catalog = undefined
          }
        }
        const childId = resolveChildId(parentId, detail.id, detail.name, catalog)
        if (childId !== undefined) {
          const resume = new AbortController()
          const onParentAbort = () => resume.abort(exec.signal.reason)
          exec.signal.addEventListener('abort', onParentAbort, { once: true })
          try {
            const ended = awaitSubagentEnd(ctx, childId, resume.signal)
            await subagents.sendMessage(agent, childId, prompt, { signal: exec.signal })
            const result = await ended
            setChildId(parentId, detail.id, childId)
            return answerFromResult(detail.name, result)
          } catch (error) {
            resume.abort(error)
            clearChildId(parentId, detail.id)
            const message = error instanceof Error ? error.message : String(error)
            // Abort should not fall through to a fresh spawn.
            if (exec.signal.aborted) throw error
            if (/aborted/i.test(message)) throw error
            // Cold-resume / delivery failure: open a new child for this expert.
          } finally {
            exec.signal.removeEventListener('abort', onParentAbort)
          }
        }
      }

      return startFresh()
    },
  }

  // ctx.tools typings come from the Host; avoid importing dsh-tools at runtime.
  const tools = ctx.tools as {
    register: (definition: unknown) => () => void
  }
  const disposeList = tools.register(listTool)
  const disposeSummon = tools.register(summonTool)

  const disposePrompt = ctx.systemPrompt.section({
    name: 'skill-experts',
    order: 420,
    text: (context?: { agent?: { session?: { header?: { parentSession?: unknown } }; id?: string } }) => {
      if (context?.agent?.session?.header?.parentSession !== undefined) return ''
      const experts = listExperts().filter(row => row.enabled)
      if (experts.length === 0) {
        return [
          '## Skill experts',
          'No skill experts are enabled. The user can enable or add them in the Skill experts sidebar.',
        ].join('\n')
      }
      const parentId = context?.agent?.id
      const continueOn = typeof parentId === 'string' && getContinueChat(parentId)
      const lines = experts
        .map(row => `- ${row.name} (id: ${row.id}, source: ${row.source}, skills: ${row.skillCount})`)
        .join('\n')
      return [
        '## Skill experts',
        'This Host provides domain skill experts (each backed by an Agent Preset with persona + skills).',
        'A session may already use one of these presets as its own agent; that is independent of @ summoning.',
        '',
        'Composer / `@` selection inserts a native reference chip that serializes as `@DisplayName`.',
        'Whenever the user message names an enabled expert that way, you MUST call `summon_skill_expert`',
        'once for **each** named expert before any user-facing reply to that @ mention.',
        'Use the remaining user text as `task`. Even a short greeting is a valid task — still summon.',
        'Do not answer the @ mention yourself first. Wait for each tool `answer`, then briefly synthesize.',
        continueOn
          ? 'Continue-chat is on for this session: keep calling `summon_skill_expert` for the same expert '
            + '(do not switch to `send_message`); the Host reuses that expert\'s prior child when possible.'
          : '',
        '',
        'Call `list_skill_experts` only when the user did not name an expert but the task clearly matches one.',
        'Do not use the generic `subagent` or `subagent_fork` tools in place of `summon_skill_expert` for these experts.',
        '',
        'Enabled experts:',
        lines,
      ].filter(line => line !== '').join('\n')
    },
  })

  return () => {
    disposePrompt()
    disposeSummon()
    disposeList()
  }
}

export { LIST as LIST_TOOL, SUMMON as SUMMON_TOOL }
