import assert from 'node:assert/strict'
import type { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, it } from 'node:test'
import JSZip from 'jszip'
import { getExpert, saveExpert, saveSkill } from '../src/catalog.ts'
import { exportExpertZip, exportExpertsZip, importExpertZip } from '../src/expert-zip.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

/** Context stub — envVars-less zips never call custom-env. */
function emptyCtx(): Context {
  return { get: () => undefined } as unknown as Context
}

describe('expert-zip', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('exports flat meta.json + skills/ and imports a new custom expert', async () => {
    fixture = withTempDshHome()
    const created = saveExpert({
      name: '代码审阅',
      description: 'review',
      avatar: '🔎',
      persona: 'You review code carefully.',
    })
    saveSkill(created.id, {
      name: 'review-diff',
      description: 'Review a diff',
      prompt: 'Focus on correctness.',
    })

    const pack = await exportExpertZip(created.id)
    assert.match(pack.filename, /\.zip$/u)
    assert.match(pack.filename, /^[a-z0-9-]+\.zip$/u)

    const zip = await JSZip.loadAsync(pack.bytes)
    const names = Object.keys(zip.files).filter(name => !zip.files[name]!.dir)
    assert.ok(names.includes('meta.json'))
    assert.ok(names.some(name => name === 'skills/review-diff/SKILL.md'))

    const meta = JSON.parse(await zip.file('meta.json')!.async('string')) as {
      name: string
      id?: string
      builtin?: boolean
      persona: string
    }
    assert.equal(meta.name, '代码审阅')
    assert.equal(meta.persona, 'You review code carefully.')
    assert.equal(meta.id, undefined)
    assert.equal(meta.builtin, undefined)

    const imported = await importExpertZip(emptyCtx(), pack.bytes)
    assert.equal(imported.count, 1)
    assert.equal(imported.ids.length, 1)
    const detail = getExpert(imported.ids[0]!)
    assert.notEqual(detail.id, created.id)
    assert.equal(detail.source, 'custom')
    assert.equal(detail.name, '代码审阅')
    assert.equal(detail.persona, 'You review code carefully.')
    assert.equal(detail.skills.length, 1)
    assert.equal(detail.skills[0]?.name, 'review-diff')
    assert.deepEqual(detail.envVars, [])
  })

  it('batch-exports folder-per-expert and imports multiple customs', async () => {
    fixture = withTempDshHome()
    const a = saveExpert({
      name: '代码审阅',
      description: 'a',
      avatar: '🔎',
      persona: 'Reviewer persona.',
    })
    saveSkill(a.id, {
      name: 'review-diff',
      description: 'Review a diff',
      prompt: 'Focus on correctness.',
    })
    const b = saveExpert({
      name: '技术写作',
      description: 'b',
      avatar: '✍️',
      persona: 'Writer persona.',
    })

    const pack = await exportExpertsZip([a.id, b.id])
    assert.equal(pack.filename, 'skill-experts.zip')

    const zip = await JSZip.loadAsync(pack.bytes)
    const names = Object.keys(zip.files).filter(name => !zip.files[name]!.dir)
    assert.ok(names.includes('dai-ma-shen-yue/meta.json'))
    assert.ok(names.includes('dai-ma-shen-yue/skills/review-diff/SKILL.md'))
    assert.ok(names.includes('ji-shu-xie-zuo/meta.json'))
    assert.ok(!names.includes('meta.json'))

    const imported = await importExpertZip(emptyCtx(), pack.bytes)
    assert.equal(imported.count, 2)
    assert.equal(imported.ids.length, 2)
    const namesImported = imported.ids.map(id => getExpert(id).name).sort()
    assert.deepEqual(namesImported, ['代码审阅', '技术写作'])
    for (const id of imported.ids) {
      assert.equal(getExpert(id).source, 'custom')
      assert.notEqual(id, a.id)
      assert.notEqual(id, b.id)
    }
  })

  it('suffixes colliding pinyin slugs on batch export', async () => {
    fixture = withTempDshHome()
    const first = saveExpert({
      name: '审阅',
      description: '',
      avatar: '1',
      persona: 'One.',
    })
    const second = saveExpert({
      name: '审阅',
      description: '',
      avatar: '2',
      persona: 'Two.',
    })
    const pack = await exportExpertsZip([first.id, second.id])
    const zip = await JSZip.loadAsync(pack.bytes)
    const names = Object.keys(zip.files).filter(name => !zip.files[name]!.dir)
    assert.ok(names.includes('shen-yue/meta.json'))
    assert.ok(names.includes('shen-yue-2/meta.json'))
  })
})
