import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { listExperts, saveExpert } from '../src/catalog.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

describe('catalog order', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('appends new custom experts in creation order without alpha-sorting', () => {
    fixture = withTempDshHome('dsh-skill-experts-order-')
    const first = saveExpert({
      name: '斑马',
      description: '',
      avatar: '1',
      persona: 'First persona.',
    })
    const second = saveExpert({
      name: '阿波罗',
      description: '',
      avatar: '2',
      persona: 'Second persona.',
    })
    const customs = listExperts().filter(row => row.source === 'custom')
    assert.equal(customs.at(-2)?.id, first.id)
    assert.equal(customs.at(-1)?.id, second.id)
  })

  it('lists built-ins before customs even when catalog ids are interleaved', () => {
    fixture = withTempDshHome('dsh-skill-experts-builtin-first-')
    // Seed catalog is created on first list/save; insert a custom between seeds
    // by appending after ensure via saveExpert (seeds already on disk after first call).
    const early = saveExpert({
      name: '中间自定义',
      description: '',
      avatar: 'x',
      persona: 'Between builtins in file order.',
    })
    const late = saveExpert({
      name: '靠后自定义',
      description: '',
      avatar: 'y',
      persona: 'After the first custom.',
    })
    const rows = listExperts()
    const firstCustom = rows.findIndex(row => row.source === 'custom')
    assert.ok(firstCustom >= 0)
    assert.ok(rows.slice(0, firstCustom).every(row => row.source === 'builtin'))
    assert.ok(rows.slice(firstCustom).every(row => row.source === 'custom'))
    const customIds = rows.filter(row => row.source === 'custom').map(row => row.id)
    assert.deepEqual(customIds.slice(-2), [early.id, late.id])
  })
})
