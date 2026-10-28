/* Hand-maintained Remote FaceModel for @woosau/dsh-skill-experts. */
import { z } from 'zod'
import { createTypertRemoteInfo } from '@deepseek-ai/dsh-typert-protocol/remote-info'

const str = () => z.string()
const expertSave = () => z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  avatar: z.string(),
  persona: z.string(),
})
const skillSave = () => z.object({
  name: z.string(),
  description: z.string(),
  prompt: z.string(),
  note: z.string().optional(),
  fromName: z.string().optional(),
})
const expertSummary = () => z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  avatar: z.string(),
  skillCount: z.number(),
  presetId: z.string(),
  source: z.enum(['builtin', 'custom']),
  enabled: z.boolean(),
})
const skillSummary = () => z.object({
  name: z.string(),
  description: z.string(),
  note: z.string(),
  absolutePath: z.string(),
})
const expertDetail = () => expertSummary().extend({
  persona: z.string(),
  skills: z.array(skillSummary()),
  rootPath: z.string(),
})
const skillDetail = () => skillSummary().extend({
  prompt: z.string(),
  extraFiles: z.array(z.string()),
})
const importResult = () => z.object({ imported: z.array(z.string()) })

const anyJson = { type: 'object', additionalProperties: true }

export const TYPERT_REMOTE = createTypertRemoteInfo({
  package: '@woosau/dsh-skill-experts',
  methods: {
    'skillExperts/list': {
      service: 'skillExperts',
      description: 'List skill experts.',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'ExpertSummary[]',
        create: () => z.array(expertSummary()),
        description: 'expert summaries',
        jsonSchema: { type: 'array', items: anyJson },
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/get': {
      service: 'skillExperts',
      description: 'Get one expert.',
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'id', description: 'expert id', source: 'json',
        codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
      }],
      result: {
        mode: 'strict', typeSymbol: 'ExpertDetail', create: expertDetail,
        description: 'expert detail', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/saveExpert': {
      service: 'skillExperts',
      description: 'Create or update an expert.',
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'input', description: 'expert fields', source: 'json',
        codec: { mode: 'strict', typeSymbol: 'ExpertSaveInput', create: expertSave, jsonSchema: anyJson },
      }],
      result: {
        mode: 'strict', typeSymbol: 'ExpertDetail', create: expertDetail,
        description: 'saved expert', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/deleteExpert': {
      service: 'skillExperts',
      description: 'Delete an expert.',
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'id', description: 'expert id', source: 'json',
        codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
      }],
      result: {
        mode: 'strict', typeSymbol: 'void', create: () => z.undefined(),
        description: 'void', jsonSchema: { type: 'null' },
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/setEnabled': {
      service: 'skillExperts',
      description: 'Enable or disable one expert.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'id', description: 'expert id', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
        {
          name: 'enabled', description: 'desired enablement', source: 'json',
          codec: {
            mode: 'strict', typeSymbol: 'boolean', create: () => z.boolean(),
            jsonSchema: { type: 'boolean' },
          },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'ExpertDetail', create: expertDetail,
        description: 'updated expert', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/getContinueChat': {
      service: 'skillExperts',
      description: 'Whether continue-chat is on for a main session.',
      invocation: { kind: 'direct' },
      parameters: [{
        name: 'sessionId', description: 'parent session id', source: 'json',
        codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
      }],
      result: {
        mode: 'strict', typeSymbol: 'boolean', create: () => z.boolean(),
        description: 'continue-chat preference', jsonSchema: { type: 'boolean' },
      },
      sourceLocation: { file: 'src/remote.ts', line: 1, column: 1 },
    },
    'skillExperts/setContinueChat': {
      service: 'skillExperts',
      description: 'Enable or disable continue-chat for a main session.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'sessionId', description: 'parent session id', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
        {
          name: 'enabled', description: 'desired preference', source: 'json',
          codec: {
            mode: 'strict', typeSymbol: 'boolean', create: () => z.boolean(),
            jsonSchema: { type: 'boolean' },
          },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'boolean', create: () => z.boolean(),
        description: 'stored preference', jsonSchema: { type: 'boolean' },
      },
      sourceLocation: { file: 'src/remote.ts', line: 1, column: 1 },
    },
    'skillExperts/getSkill': {
      service: 'skillExperts',
      description: 'Get one skill.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'expertId', description: 'expert id', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
        {
          name: 'skillName', description: 'skill name', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'SkillDetail', create: skillDetail,
        description: 'skill detail', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/saveSkill': {
      service: 'skillExperts',
      description: 'Create or update a skill.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'expertId', description: 'expert id', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
        {
          name: 'input', description: 'skill fields', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'SkillSaveInput', create: skillSave, jsonSchema: anyJson },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'SkillDetail', create: skillDetail,
        description: 'saved skill', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/deleteSkill': {
      service: 'skillExperts',
      description: 'Delete a skill.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'expertId', description: 'expert id', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
        {
          name: 'skillName', description: 'skill name', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'void', create: () => z.undefined(),
        description: 'void', jsonSchema: { type: 'null' },
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/importZip': {
      service: 'skillExperts',
      description: 'Import skills from a zip (base64).',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'expertId', description: 'expert id', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
        {
          name: 'zipBase64', description: 'zip as base64', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'ImportResult', create: importResult,
        description: 'imported names', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/index.ts', line: 1, column: 1 },
    },
    'skillExperts/exportExpert': {
      service: 'skillExperts',
      description: 'Export one expert as a downloadable zip (base64).',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'id', description: 'expert id', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'ExpertZipExport', create: () => z.object({
          filename: z.string(),
          zipBase64: z.string(),
        }).strict(),
        description: 'zip payload', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/remote.ts', line: 1, column: 1 },
    },
    'skillExperts/importExpert': {
      service: 'skillExperts',
      description: 'Import a single- or multi-expert zip (base64) as new custom experts.',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'zipBase64', description: 'zip as base64', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string', create: str, jsonSchema: { type: 'string' } },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'ExpertZipImportResult', create: () => z.object({
          count: z.number(),
          ids: z.array(z.string()),
        }).strict(),
        description: 'imported expert ids', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/remote.ts', line: 1, column: 1 },
    },
    'skillExperts/exportExperts': {
      service: 'skillExperts',
      description: 'Export several experts as one zip (base64).',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'ids', description: 'expert ids', source: 'json',
          codec: { mode: 'strict', typeSymbol: 'string[]', create: () => z.array(z.string()), jsonSchema: { type: 'array', items: { type: 'string' } } },
        },
      ],
      result: {
        mode: 'strict', typeSymbol: 'ExpertZipExport', create: () => z.object({
          filename: z.string(),
          zipBase64: z.string(),
        }).strict(),
        description: 'zip payload', jsonSchema: anyJson,
      },
      sourceLocation: { file: 'src/remote.ts', line: 1, column: 1 },
    },
  },
}, z)

export default TYPERT_REMOTE
