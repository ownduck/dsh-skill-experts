import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { saveExpert } from '../src/catalog.ts'
import { expertSkillsDir, presetIdFor } from '../src/paths.ts'
import { buildDefinition } from '../src/preset-sync.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

describe('preset isolation', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('scopes skill-filesystem to the expert skills dir only', () => {
    fixture = withTempDshHome('dsh-skill-experts-preset-')
    const expert = saveExpert({
      name: 'Isolated',
      description: '',
      avatar: '📖',
      persona: 'Stay in your lane.',
    })
    const definition = buildDefinition(expert.id)
    assert.equal(definition.id, presetIdFor(expert.id))

    const skillFs = definition.plugins.find(plugin => plugin.id === 'skill-filesystem')
    assert.ok(skillFs !== undefined)
    const config = skillFs.config as {
      includeDefaultRoots?: boolean
      customSkillDirs?: readonly string[]
    }
    assert.equal(config.includeDefaultRoots, false)
    assert.deepEqual(config.customSkillDirs, [expertSkillsDir(expert.id)])

    const persona = definition.plugins.find(plugin => plugin.id === 'persona')
    assert.ok(persona !== undefined)
    const personaConfig = persona.config as { complete?: boolean; prefix?: string }
    assert.equal(personaConfig.complete, true)
    assert.equal(personaConfig.prefix, 'Stay in your lane.')
  })
})
