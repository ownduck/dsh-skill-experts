import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { exportSlug } from '../src/export-slug.ts'

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
