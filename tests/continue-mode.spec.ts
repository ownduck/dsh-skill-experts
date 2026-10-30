import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import {
  clearChildId,
  getChildId,
  getContinueChat,
  resolveChildId,
  setChildId,
  setContinueChat,
} from '../src/continue-mode.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

describe('continue-mode', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('defaults continue-chat on and persists an explicit off', () => {
    fixture = withTempDshHome('dsh-skill-experts-continue-')
    const parent = 'session-a'
    assert.equal(getContinueChat(parent), true)
    assert.equal(setContinueChat(parent, false), false)
    assert.equal(getContinueChat(parent), false)
    const path = join(fixture.home, 'skill-experts', 'continue.json')
    assert.equal(existsSync(path), true)
    const raw = JSON.parse(readFileSync(path, 'utf8')) as {
      byParent: Record<string, { continue: boolean }>
    }
    assert.equal(raw.byParent[parent]?.continue, false)
    assert.equal(setContinueChat(parent, true), true)
    assert.equal(getContinueChat(parent), true)
  })

  it('maps children by expert.id and keeps them when continue turns off', () => {
    fixture = withTempDshHome('dsh-skill-experts-continue-map-')
    const parent = 'session-b'
    setContinueChat(parent, true)
    setChildId(parent, 'code-reviewer', 'child-1')
    assert.equal(getChildId(parent, 'code-reviewer'), 'child-1')
    assert.equal(setContinueChat(parent, false), false)
    assert.equal(getContinueChat(parent), false)
    assert.equal(getChildId(parent, 'code-reviewer'), 'child-1')
    assert.equal(setContinueChat(parent, true), true)
    assert.equal(getChildId(parent, 'code-reviewer'), 'child-1')
  })

  it('keeps a child written while continue is off for a later turn-on', () => {
    fixture = withTempDshHome('dsh-skill-experts-continue-off-write-')
    const parent = 'session-off'
    assert.equal(setContinueChat(parent, false), false)
    assert.equal(getContinueChat(parent), false)
    setChildId(parent, 'tech-writer', 'child-while-off')
    assert.equal(getContinueChat(parent), false)
    assert.equal(getChildId(parent, 'tech-writer'), 'child-while-off')
    assert.equal(setContinueChat(parent, true), true)
    assert.equal(getChildId(parent, 'tech-writer'), 'child-while-off')
  })

  it('setChildId does not flip the default-on preference to off', () => {
    fixture = withTempDshHome('dsh-skill-experts-continue-child-default-')
    const parent = 'session-default-child'
    assert.equal(getContinueChat(parent), true)
    setChildId(parent, 'tech-writer', 'child-1')
    assert.equal(getContinueChat(parent), true)
  })

  it('resolveChildId prefers disk map over label fallback', () => {
    fixture = withTempDshHome('dsh-skill-experts-continue-resolve-')
    const parent = 'session-c'
    setChildId(parent, 'tech-writer', 'child-disk')
    const found = resolveChildId(parent, 'tech-writer', '技术写手', [
      { id: 'child-label', mode: 'continuable', label: '技术写手', createdAt: 99 },
    ])
    assert.equal(found, 'child-disk')
  })

  it('resolveChildId falls back to newest continuable label match and writes expert.id', () => {
    fixture = withTempDshHome('dsh-skill-experts-continue-label-')
    const parent = 'session-d'
    assert.equal(getChildId(parent, 'code-reviewer'), undefined)
    const found = resolveChildId(parent, 'code-reviewer', '代码审查', [
      { id: 'old', mode: 'continuable', label: '代码审查', createdAt: 1 },
      { id: 'new', mode: 'continuable', label: '代码审查', createdAt: 9 },
      { id: 'other', mode: 'continuable', label: '别的', createdAt: 99 },
      { id: 'oneshot', mode: 'one-shot', label: '代码审查', createdAt: 100 },
    ])
    assert.equal(found, 'new')
    assert.equal(getChildId(parent, 'code-reviewer'), 'new')
  })

  it('clearChildId drops one expert pointer only', () => {
    fixture = withTempDshHome('dsh-skill-experts-continue-clear-')
    const parent = 'session-e'
    setContinueChat(parent, true)
    setChildId(parent, 'a', 'child-a')
    setChildId(parent, 'b', 'child-b')
    clearChildId(parent, 'a')
    assert.equal(getChildId(parent, 'a'), undefined)
    assert.equal(getChildId(parent, 'b'), 'child-b')
  })
})
