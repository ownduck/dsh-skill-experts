import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseSkillMd, serializeSkillMd } from '../src/skill-md.ts'

describe('skill-md', () => {
  it('round-trips name, description, and prompt', () => {
    const raw = serializeSkillMd({
      name: 'demo-skill',
      description: 'A short description',
      prompt: 'Do the thing.\n',
    })
    const parsed = parseSkillMd(raw, 'SKILL.md')
    assert.equal(parsed.frontmatter.name, 'demo-skill')
    assert.equal(parsed.frontmatter.description, 'A short description')
    assert.equal(parsed.prompt, 'Do the thing.\n')
  })

  it('rejects missing frontmatter', () => {
    assert.throws(() => parseSkillMd('# no fm\n', 'SKILL.md'), /frontmatter/)
  })
})
