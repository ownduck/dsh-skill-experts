/** Expert env-var editor: local drafts until Save persists via custom-env. */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  IconTrashOutlineRegular,
  Input,
  Modal,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ExpertEnvVar } from '../types.ts'
import css from './EnvModal.module.css'
import { formatRemoteError } from './format-remote-error.ts'
import type { ExpertsKey } from './locales.ts'

const NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u

type Translate = (key: ExpertsKey) => string

interface DraftRow {
  readonly key: string
  name: string
  value: string
}

export interface EnvModalProps {
  readonly t: Translate
  readonly open: boolean
  readonly expertId: string
  readonly expertLabel: string
  readonly getEnv: (id: string) => Promise<readonly ExpertEnvVar[]>
  readonly customEnvStatus: () => Promise<{ available: boolean }>
  readonly saveExpertEnv: (id: string, entries: readonly ExpertEnvVar[]) => Promise<void>
  readonly busy: boolean
  readonly setBusy: (value: boolean) => void
  readonly onClose: () => void
}

let rowSeq = 0
function allocKey(): string {
  rowSeq += 1
  return `env-row-${rowSeq}`
}

function emptyRow(): DraftRow {
  return { key: allocKey(), name: '', value: '' }
}

function withTrailingEmpty(rows: readonly DraftRow[]): DraftRow[] {
  if (rows.length === 0) return [emptyRow()]
  const last = rows[rows.length - 1]!
  if (last.name === '' && last.value === '') return [...rows]
  return [...rows, emptyRow()]
}

function fromEntries(entries: readonly ExpertEnvVar[]): DraftRow[] {
  return withTrailingEmpty(entries.map(entry => ({
    key: allocKey(),
    name: entry.name,
    value: entry.value,
  })))
}

function collectEntries(rows: readonly DraftRow[]): ExpertEnvVar[] | { error: 'invalid' | 'duplicate' } {
  const out: ExpertEnvVar[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    const name = row.name.trim()
    if (name === '') continue
    if (!NAME_OK.test(name)) return { error: 'invalid' }
    if (seen.has(name)) return { error: 'duplicate' }
    seen.add(name)
    out.push({ name, value: row.value })
  }
  return out
}

/** Expert environment variables modal. */
export function EnvModal(props: EnvModalProps): ReactNode {
  const { t, open, expertId } = props
  const [available, setAvailable] = useState<boolean | null>(null)
  const [rows, setRows] = useState<DraftRow[]>([emptyRow()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (expertId === '') return
    setLoading(true)
    setError('')
    try {
      const status = await props.customEnvStatus()
      setAvailable(status.available)
      setRows(fromEntries(await props.getEnv(expertId)))
    } catch (err) {
      setError(formatRemoteError(err, t))
      setAvailable(false)
      setRows([emptyRow()])
    } finally {
      setLoading(false)
    }
  }, [expertId, props.customEnvStatus, props.getEnv, t])

  useEffect(() => {
    if (!open) {
      setAvailable(null)
      setRows([emptyRow()])
      setError('')
      setLoading(false)
      return
    }
    void reload()
  }, [open, reload])

  const missingPlugin = available === false
  const disabled = props.busy || loading || missingPlugin

  const updateRow = (key: string, patch: Partial<Pick<DraftRow, 'name' | 'value'>>): void => {
    setRows(previous => withTrailingEmpty(previous.map(row => (
      row.key === key ? { ...row, ...patch } : row
    ))))
  }

  const removeRow = (key: string): void => {
    setRows(previous => withTrailingEmpty(previous.filter(row => row.key !== key)))
  }

  const save = async (): Promise<void> => {
    if (missingPlugin) {
      setError(t('error.custom-env-missing'))
      return
    }
    const collected = collectEntries(rows)
    if ('error' in collected) {
      setError(collected.error === 'duplicate' ? t('error.env-name-duplicate') : t('env.validationName'))
      return
    }
    props.setBusy(true)
    setError('')
    try {
      await props.saveExpertEnv(expertId, collected)
      props.onClose()
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      props.setBusy(false)
    }
  }

  const title = props.expertLabel === '' ? t('env.title') : `${props.expertLabel} · ${t('env.title')}`
  const notice = error !== ''
    ? error
    : missingPlugin
      ? t('error.custom-env-missing')
      : undefined

  return (
    <Modal
      open={open}
      onClose={props.onClose}
      title={title}
      closeLabel={t('action.close')}
      className={css.modal}
      footer={(
        <div className={css.footer}>
          <button type="button" className={css.ghostBtn} onClick={props.onClose} disabled={props.busy}>
            {t('action.cancel')}
          </button>
          <button
            type="button"
            className={css.primaryBtn}
            onClick={() => { void save() }}
            disabled={disabled}
          >
            {t('action.save')}
          </button>
        </div>
      )}
    >
      <div className={css.content}>
        {notice !== undefined ? (
          <p className={css.notice} role="status">{notice}</p>
        ) : null}

        <div className={css.header}>
          <p className={css.headerLabel}>{t('env.name')}</p>
          <p className={css.headerLabel}>{t('env.value')}</p>
          <div aria-hidden="true" />
        </div>

        {loading ? (
          <p className={css.empty}>{t('panel.loading')}</p>
        ) : (
          <div className={css.list}>
            {rows.map((row, index) => {
              const isTrailingEmpty = index === rows.length - 1 && row.name === '' && row.value === ''
              return (
                <div key={row.key} className={css.row}>
                  <Input
                    value={row.name}
                    disabled={disabled}
                    onChange={event => updateRow(row.key, { name: event.target.value })}
                    placeholder={isTrailingEmpty ? t('env.namePlaceholder') : undefined}
                    aria-label={t('env.name')}
                  />
                  <Input
                    value={row.value}
                    disabled={disabled}
                    onChange={event => updateRow(row.key, { value: event.target.value })}
                    placeholder={isTrailingEmpty ? t('env.valuePlaceholder') : undefined}
                    aria-label={t('env.value')}
                  />
                  {isTrailingEmpty ? (
                    <div className={css.trashSlot} aria-hidden="true" />
                  ) : (
                    <Tooltip portal label={t('action.delete')} side="top" delayMs={400}>
                      <button
                        type="button"
                        className={css.trashBtn}
                        aria-label={t('action.delete')}
                        disabled={disabled}
                        onClick={() => removeRow(row.key)}
                      >
                        <IconTrashOutlineRegular size={16} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
