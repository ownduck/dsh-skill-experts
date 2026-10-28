import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { ensureSeeded, listExperts, saveExpert } from '../src/catalog.ts'
import { expertDir, expertMetaPath } from '../src/paths.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

function writeSeed(root: string, id: string, name: string): void {
  const dir = join(root, id)
  mkdirSync(join(dir, 'skills'), { recursive: true })
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify({
    id,
    name,
    description: '',
    avatar: '🌱',
    persona: `${name} persona.`,
    builtin: true,
  }, undefined, 2)}\n`, 'utf8')
}

function writeHomeExpert(id: string, name: string, builtin: boolean): void {
  mkdirSync(join(expertDir(id), 'skills'), { recursive: true })
  writeFileSync(expertMetaPath(id), `${JSON.stringify({
    id,
    name,
    description: '',
    avatar: '🌱',
    persona: `${name} persona.`,
    builtin,
  }, undefined, 2)}\n`, 'utf8')
}

describe('ensureSeeded', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('copies a newly added seed when catalog.json already exists', () => {
    fixture = withTempDshHome('dsh-skill-experts-seed-fill-')
    const seedRoot = join(fixture.home, 'fake-seed')
    writeSeed(seedRoot, 'alpha-seed', 'Alpha')
    ensureSeeded(seedRoot)

    const custom = saveExpert({
      name: '本地自定义',
      description: '',
      avatar: '1',
      persona: 'Custom persona.',
    })

    writeSeed(seedRoot, 'beta-seed', 'Beta')
    ensureSeeded(seedRoot)

    const rows = listExperts()
    const ids = rows.map(row => row.id)
    assert.ok(ids.includes('alpha-seed'))
    assert.ok(ids.includes('beta-seed'))
    assert.ok(ids.includes(custom.id))
    assert.equal(rows.find(row => row.id === 'beta-seed')?.source, 'builtin')
    assert.equal(existsSync(join(fixture.home, 'skill-experts', 'beta-seed', 'meta.json')), true)

    // Existing local copy is not overwritten on a second ensure.
    const metaPath = join(fixture.home, 'skill-experts', 'alpha-seed', 'meta.json')
    const before = readFileSync(metaPath, 'utf8')
    writeFileSync(metaPath, `${JSON.stringify({
      id: 'alpha-seed',
      name: 'Alpha-local',
      description: 'touched',
      avatar: '🌱',
      persona: 'Locally edited.',
      builtin: true,
    }, undefined, 2)}\n`, 'utf8')
    ensureSeeded(seedRoot)
    assert.equal(JSON.parse(readFileSync(metaPath, 'utf8')).name, 'Alpha-local')
    assert.notEqual(readFileSync(metaPath, 'utf8'), before)
  })

  it('retires builtins absent from the current seed root and fills new seeds', () => {
    fixture = withTempDshHome('dsh-skill-experts-seed-retire-')
    const seedRoot = join(fixture.home, 'fake-seed')
    writeSeed(seedRoot, 'frontend-developer', 'Frontend')
    writeHomeExpert('code-reviewer', '代码审阅', true)
    writeHomeExpert('tech-writer', '技术写作', true)
    writeFileSync(join(fixture.home, 'skill-experts', 'catalog.json'), `${JSON.stringify({
      revision: 1,
      experts: ['code-reviewer', 'tech-writer'],
    }, undefined, 2)}\n`, 'utf8')

    ensureSeeded(seedRoot)

    const ids = listExperts().map(row => row.id)
    assert.ok(ids.includes('frontend-developer'))
    assert.equal(ids.includes('code-reviewer'), false)
    assert.equal(ids.includes('tech-writer'), false)
    assert.equal(existsSync(expertMetaPath('code-reviewer')), false)
    assert.equal(existsSync(expertMetaPath('tech-writer')), false)
    assert.equal(existsSync(expertMetaPath('frontend-developer')), true)
  })

  it('does not retire a custom expert whose id is absent from seeds', () => {
    fixture = withTempDshHome('dsh-skill-experts-seed-keep-custom-')
    const seedRoot = join(fixture.home, 'fake-seed')
    writeSeed(seedRoot, 'frontend-developer', 'Frontend')
    writeHomeExpert('code-reviewer', '我的审阅', false)
    writeFileSync(join(fixture.home, 'skill-experts', 'catalog.json'), `${JSON.stringify({
      revision: 1,
      experts: ['code-reviewer'],
    }, undefined, 2)}\n`, 'utf8')

    ensureSeeded(seedRoot)

    assert.equal(existsSync(expertMetaPath('code-reviewer')), true)
    assert.equal(JSON.parse(readFileSync(expertMetaPath('code-reviewer'), 'utf8')).builtin, false)
    assert.ok(listExperts().some(row => row.id === 'code-reviewer' && row.source === 'custom'))
  })
})
