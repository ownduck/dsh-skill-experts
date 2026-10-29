import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { saveExpert } from '../src/catalog.ts'
import { exportSlug } from '../src/export-slug.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

describe('exportSlug', () => {
  it('romanizes Chinese display names to tone-less pinyin kebab', () => {
    const slug = exportSlug('代码审阅')
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u)
    assert.ok(slug.includes('dai'))
    assert.ok(slug.includes('ma') || slug.includes('dai-ma'))
  })

  it('kebab-cases ASCII names', () => {
    assert.equal(exportSlug('Code Reviewer'), 'code-reviewer')
  })

  it('falls back for empty names', () => {
    assert.equal(exportSlug('   '), 'expert')
  })
})

describe('allocExpertId via saveExpert', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('uses pinyin slug as the expert directory id', () => {
    fixture = withTempDshHome('dsh-skill-experts-id-')
    const expected = exportSlug('社媒媒体制作')
    const created = saveExpert({
      name: '社媒媒体制作',
      description: 'test',
      avatar: '🎬',
      persona: 'persona',
    })
    assert.equal(created.id, expected)
    assert.equal(created.rootPath.endsWith(expected) || created.rootPath.endsWith(`\\${expected}`) || created.rootPath.endsWith(`/${expected}`), true)

    const again = saveExpert({
      name: '社媒媒体制作',
      description: 'collision',
      avatar: '🎬',
      persona: 'persona',
    })
    assert.equal(again.id, `${expected}-2`)
  })
})
