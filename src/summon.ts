/** Model tools: list and summon skill experts as spawn subagents. */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { getExpert, listExperts } from './catalog.ts'
import { presetIdFor } from './paths.ts'

const LIST = 'list_skill_experts'
const SUMMON = 'summon_skill_expert'

/**
 * Register list/summon tools and system-prompt guidance (agency-style).
 * @param ctx - Host context with tools / subagents / systemPrompt.
 * @returns disposer.
 */
export function registerSummonTools(ctx: Context): () => void {
  const listTool = defineTool({
    name: LIST,
    description:
      'List skill experts managed by dsh-skill-experts (id, name, avatar, skillCount, presetId). '
      + 'Call this before summon_skill_expert when choosing an expert by name. '
      + 'Do not use the generic subagent tool for these experts.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          experts: { type: 'array', required: true, items: { type: 'json' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: JSON.stringify(value, undefined, 2),
      }],
    },
    async execute() {
      return { experts: [...listExperts()] }
    },
  })

  const summonTool = defineTool({
    name: SUMMON,
    description:
      'Summon one skill expert as an independent spawn subagent with that expert\'s Agent Preset '
      + '(persona + isolated skills). Pass the expert id or exact display name from list_skill_experts, '
      + 'and a short task brief. Do not use the generic subagent tool for skill experts. '
      + 'This starts the child and returns immediately; wait for the completion notice, then synthesize for the user.',
    parameters: {
      expert: {
        type: 'string',
        required: true,
        description: 'Expert id or exact display name from list_skill_experts.',
      },
      task: {
        type: 'string',
        required: true,
        description: 'Short brief: goal, constraints, and relevant paths. Do not paste large source dumps.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { type: 'string', required: true, const: 'activation' },
          subagentId: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: `started skill expert subagent ${value.subagentId}` }],
    },
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      const agent = exec.agent as Agent | undefined
      if (agent === undefined) throw new Error('summon_skill_expert requires a calling agent')
      if (agent.session.header.parentSession !== undefined) {
        throw new Error('skill experts cannot summon further skill experts')
      }
      const expertKey = String(args.expert ?? '').trim()
      const task = String(args.task ?? '').trim()
      if (expertKey === '' || task === '') throw new Error('expert and task are required')

      const roster = listExperts()
      const match = roster.find(row => row.id === expertKey || row.name === expertKey)
      if (match === undefined) {
        throw new Error(`unknown skill expert "${expertKey}"; call list_skill_experts first`)
      }
      const detail = getExpert(match.id)
      const subagents = ctx.get('subagents')
      if (subagents === undefined) throw new Error('subagents service unavailable')
      if (typeof subagents.startActivation !== 'function') {
        throw new Error('subagents.startActivation unavailable')
      }

      const prompt: ContentBlock[] = [{
        type: 'text',
        text: [
          `You are the skill expert "${detail.name}".`,
          'Follow your persona and use your available skills as needed.',
          '',
          '## Task',
          task,
        ].join('\n'),
      }]

      const started = await subagents.startActivation({
        provider: 'spawn',
        label: detail.name,
        delivery: 'parent',
        request: {
          parent: agent,
          prompt,
          agentPreset: presetIdFor(detail.id),
          signal: exec.signal,
        },
      })

      return { kind: 'activation' as const, subagentId: started.childId }
    },
  })

  const disposeList = ctx.tools.register(listTool)
  const disposeSummon = ctx.tools.register(summonTool)

  const disposePrompt = ctx.systemPrompt.section({
    name: 'skill-experts',
    order: 420,
    text: () => {
      const experts = listExperts()
      if (experts.length === 0) {
        return [
          '## Skill experts',
          'No skill experts are configured yet. The user can add them in the Skill experts sidebar.',
        ].join('\n')
      }
      const lines = experts.map(row => `- ${row.name} (id: ${row.id}, skills: ${row.skillCount})`).join('\n')
      return [
        '## Skill experts',
        'This Host provides domain skill experts (persona + isolated skills).',
        'When the user asks for a listed expert or a task that clearly matches one, call `list_skill_experts` if needed, then `summon_skill_expert` immediately with a short brief.',
        'Do **not** use the generic `subagent` or `subagent_fork` tools to impersonate these experts.',
        'After summoning, wait for the completion notification and synthesize the expert result for the user.',
        '',
        'Current experts:',
        lines,
      ].join('\n')
    },
  })

  return () => {
    disposePrompt()
    disposeSummon()
    disposeList()
  }
}

export { LIST as LIST_TOOL, SUMMON as SUMMON_TOOL }
