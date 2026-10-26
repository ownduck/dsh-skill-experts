/* Hand-maintained Remote FaceModel for @woosau/dsh-skill-experts. */
import { z } from 'zod'
import { createTypertRemoteInfo } from '@deepseek-ai/dsh-typert-protocol/remote-info'

const str = () => z.string()
const expertSave = () => z.object({
  id: z.string().optional(),
  name: z.string(),
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
  avatar: z.string(),
  skillCount: z.number(),
  presetId: z.string(),
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
  },
}, z)

export default TYPERT_REMOTE
