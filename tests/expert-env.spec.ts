import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { Context } from '@deepseek-ai/cordis'
import { afterEach, describe, it } from 'node:test'
import { getExpert, replaceExpertEnv, saveExpert } from '../src/catalog.ts'
import { requireCustomEnv } from '../src/custom-env-bridge.ts'
import { SkillExpertsError } from '../src/errors.ts'
import { exportExpertZip, importExpertZip } from '../src/expert-zip.ts'
import { expertMetaPath } from '../src/paths.ts'
import { withTempDshHome, type TempDshHome } from './helpers/temp-dsh-home.ts'

function mockCtx(store: Record<string, string> = {}): Context {
  return {
    get(name: string) {
      if (name !== 'customEnv') return undefined
      return {
        async setVar(key: string, value: string) {
          store[key] = value
        },
        async removeVar(key: string) {
          const had = Object.hasOwn(store, key)
          delete store[key]
          return had
        },
      }
    },
  } as unknown as Context
}

describe('expert env vars', () => {
  let fixture: TempDshHome | undefined

  afterEach(() => {
    fixture?.restore()
    fixture = undefined
  })

  it('persists envVars on meta and preserves them across saveExpert', async () => {
    fixture = withTempDshHome()
    const store: Record<string, string> = {}
    const ctx = mockCtx(store)
    const created = saveExpert({
      name: 'Env Expert',
      description: '',
      avatar: '🧪',
      persona: 'Persona.',
    })
    await replaceExpertEnv(ctx, created.id, [
      { name: 'FOO', value: 'one' },
      { name: 'EMPTY', value: '' },
    ])
    assert.deepEqual(store, { FOO: 'one', EMPTY: '' })
    assert.deepEqual(getExpert(created.id).envVars, [
      { name: 'FOO', value: 'one' },
      { name: 'EMPTY', value: '' },
    ])

    saveExpert({
      id: created.id,
      name: 'Env Expert Renamed',
      description: 'd',
      avatar: '🧪',
      persona: 'Persona.',
    })
    assert.equal(getExpert(created.id).name, 'Env Expert Renamed')
    assert.deepEqual(getExpert(created.id).envVars, [
      { name: 'FOO', value: 'one' },
      { name: 'EMPTY', value: '' },
    ])
    const raw = JSON.parse(readFileSync(expertMetaPath(created.id), 'utf8')) as { envVars?: unknown }
    assert.deepEqual(raw.envVars, [
      { name: 'FOO', value: 'one' },
      { name: 'EMPTY', value: '' },
    ])
  })

  it('removeVar on deleted names and rejects missing custom-env', async () => {
    fixture = withTempDshHome()
    const store: Record<string, string> = {}
    const ctx = mockCtx(store)
    const created = saveExpert({
      name: 'Env Expert',
      description: '',
      avatar: '🧪',
      persona: 'Persona.',
    })
    await replaceExpertEnv(ctx, created.id, [
      { name: 'KEEP', value: '1' },
      { name: 'DROP', value: '2' },
    ])
    await replaceExpertEnv(ctx, created.id, [{ name: 'KEEP', value: '1' }])
    assert.deepEqual(store, { KEEP: '1' })
    assert.deepEqual(getExpert(created.id).envVars, [{ name: 'KEEP', value: '1' }])

    assert.throws(
      () => requireCustomEnv({ get: () => undefined } as unknown as Context),
      (error: unknown) => error instanceof SkillExpertsError && error.reason === 'custom-env-missing',
    )
  })

  it('exports envVars with live process.env overlay and imports via custom-env', async () => {
    fixture = withTempDshHome()
    const store: Record<string, string> = {}
    const ctx = mockCtx(store)
    const created = saveExpert({
      name: 'Pack Env',
      description: '',
      avatar: '📦',
      persona: 'Persona.',
    })
    await replaceExpertEnv(ctx, created.id, [{ name: 'PACK_KEY', value: 'default' }])
    process.env.PACK_KEY = 'live'
    try {
      const pack = await exportExpertZip(created.id)
      const JSZip = (await import('jszip')).default
      const zip = await JSZip.loadAsync(pack.bytes)
      const meta = JSON.parse(await zip.file('meta.json')!.async('string')) as {
        envVars: { name: string; value: string }[]
      }
      assert.deepEqual(meta.envVars, [{ name: 'PACK_KEY', value: 'live' }])

      const importStore: Record<string, string> = {}
      const importCtx = mockCtx(importStore)
      const imported = await importExpertZip(importCtx, pack.bytes)
      const detail = getExpert(imported.ids[0]!)
      assert.deepEqual(detail.envVars, [{ name: 'PACK_KEY', value: 'live' }])
      assert.equal(importStore.PACK_KEY, 'live')
    } finally {
      delete process.env.PACK_KEY
    }
  })
})
