import assert from 'node:assert/strict'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { deleteSkill, ensureSeeded, saveSkill } from '../src/catalog.ts'
import { SkillExpertsError } from '../src/errors.ts'
import { expertDir } from '../src/paths.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

function writeSeed(root: string, id: string): void {
  const dir = join(root, id)
  mkdirSync(join(dir, 'skills', 'core-skill'), { recursive: true })
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify({
    id,
    name: id,
    description: 'desc',
    avatar: '🌱',
    persona: 'persona',
    builtin: true,
  }, undefined, 2)}\n`, 'utf8')
  writeFileSync(join(dir, 'skills', 'core-skill', 'SKILL.md'), `---
name: core-skill
description: Core skill.
---

# Body
`)
}

describe('builtin skill guards', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('allows editing an existing builtin skill but blocks add, rename, and delete', () => {
    fixture = withTempDshHome('dsh-skill-experts-builtin-skill-')
    const seedRoot = join(fixture.home, 'fake-seed')
    writeSeed(seedRoot, 'frontend-developer')
    ensureSeeded(seedRoot)

    const updated = saveSkill('frontend-developer', {
      name: 'core-skill',
      description: 'Updated description.',
      prompt: '# Updated body',
      fromName: 'core-skill',
    })
    assert.equal(updated.description, 'Updated description.')
    assert.equal(updated.prompt.trim(), '# Updated body')

    assert.throws(
      () => saveSkill('frontend-developer', {
        name: 'brand-new',
        description: 'x',
        prompt: 'y',
      }),
      (error: unknown) => error instanceof SkillExpertsError && error.reason === 'builtin-cannot-add-skill',
    )

    assert.throws(
      () => saveSkill('frontend-developer', {
        name: 'renamed-skill',
        description: 'x',
        prompt: 'y',
        fromName: 'core-skill',
      }),
      (error: unknown) => error instanceof SkillExpertsError && error.reason === 'builtin-cannot-add-skill',
    )

    assert.throws(
      () => deleteSkill('frontend-developer', 'core-skill'),
      (error: unknown) => error instanceof SkillExpertsError && error.reason === 'builtin-cannot-delete-skill',
    )

    assert.ok(existsSync(join(expertDir('frontend-developer'), 'skills', 'core-skill', 'SKILL.md')))
  })
})
