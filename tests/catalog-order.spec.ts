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
    const ids = listExperts().map(row => row.id)
    assert.equal(ids.at(-2), first.id)
    assert.equal(ids.at(-1), second.id)
  })
})
