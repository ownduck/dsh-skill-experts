import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildExpertChip,
  expertClipboardText,
  expertModelSerializeText,
  EXPERT_CHIP_SOURCE,
} from '../src/client/composer-chip.ts'

describe('composer-chip', () => {
  it('clipboard text is @Name + NBSP without summon directives', () => {
    assert.equal(expertClipboardText('泼妇'), `@泼妇\u00A0`)
    assert.equal(expertClipboardText('@@代码审阅'), `@代码审阅\u00A0`)
    assert.ok(!expertClipboardText('泼妇').includes('summon_skill_expert'))
  })

  it('model serialize matches clipboard @Name + NBSP', () => {
    const expert = { id: 'custom-po-fu', name: '泼妇' }
    assert.equal(expertModelSerializeText(expert), expertClipboardText(expert.name))
    assert.ok(!expertModelSerializeText(expert).includes('summon_skill_expert'))
  })

  it('buildExpertChip uses UI clipboard text and stable source', () => {
    const chip = buildExpertChip({ id: 'x', name: '技术写作' })
    assert.equal(chip.source, EXPERT_CHIP_SOURCE)
    assert.equal(chip.ref, 'x')
    assert.equal(chip.label, '技术写作')
    assert.equal(chip.clipboardText, `@技术写作\u00A0`)
    assert.equal(chip.appearance, 'session')
  })
})
