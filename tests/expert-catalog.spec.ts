import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { renderExpertCatalogEntries } from '../src/summon.ts'

describe('renderExpertCatalogEntries', () => {
  it('renders skill-style name and description lines with id', () => {
    assert.deepEqual(
      renderExpertCatalogEntries([
        { name: '社媒媒体制作', description: '短视频与社媒成片策划制作', id: 'custom-media' },
        { name: '泼妇', description: '', id: 'custom-po-fu' },
      ]),
      [
        '- `社媒媒体制作`: 短视频与社媒成片策划制作 (id: custom-media)',
        '- `泼妇`: (no description) (id: custom-po-fu)',
      ],
    )
  })
})
