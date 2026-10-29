/** Expert env-var editor: row Confirm/Cancel for local checks; Save persists. */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  IconCheckOutlineRegular,
  IconCloseOutlineRegular,
  IconTrashOutlineRegular,
  Input,
  Modal,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { ExpertEnvVar, ExpertSource } from '../types.ts'
import css from './EnvModal.module.css'
import { formatRemoteError } from './format-remote-error.ts'
import type { ExpertsKey } from './locales.ts'

const NAME_OK = /^[A-Za-z_][A-Za-z0-9_]*$/u
const NEW_KEY = '__new__'

type Translate = (key: ExpertsKey) => string
type Cell = { name: string; value: string }

export interface EnvModalProps {
  readonly t: Translate
  readonly open: boolean
  readonly expertId: string
  readonly expertLabel: string
  /** Built-in experts may only change values. */
  readonly source: ExpertSource
  readonly getEnv: (id: string) => Promise<readonly ExpertEnvVar[]>
  readonly customEnvStatus: () => Promise<{ available: boolean }>
  readonly saveExpertEnv: (id: string, entries: readonly ExpertEnvVar[]) => Promise<void>
  /** Open sidebar Plugins when provided. */
  readonly openPlugins?: () => void
  readonly busy: boolean
  readonly setBusy: (value: boolean) => void
  readonly onClose: () => void
}

let rowSeq = 0
function allocKey(): string {
  rowSeq += 1
  return `env-row-${rowSeq}`
}

function emptyCell(): Cell {
  return { name: '', value: '' }
}

function collectEntries(
  keys: readonly string[],
  accepted: Readonly<Record<string, Cell>>,
): ExpertEnvVar[] | { error: 'invalid' | 'duplicate' } {
  const out: ExpertEnvVar[] = []
  const seen = new Set<string>()
  for (const key of keys) {
    const cell = accepted[key]
    if (cell === undefined) continue
    const name = cell.name.trim()
    if (name === '') continue
    if (!NAME_OK.test(name)) return { error: 'invalid' }
    if (seen.has(name)) return { error: 'duplicate' }
    seen.add(name)
    out.push({ name, value: cell.value })
  }
  return out
}

function IconAction({
  label, disabled, onClick, danger, primary, children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  danger?: boolean
  primary?: boolean
  children: ReactNode
}): ReactNode {
  return (
    <Tooltip portal label={label} side="top" delayMs={400}>
      <button
        type="button"
        className={[css.iconButton, danger ? css.iconButtonDanger : '', primary ? css.iconButtonPrimary : '']
          .filter(Boolean)
          .join(' ')}
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  )
}

function Slot({ empty, children }: { empty: boolean; children: ReactNode }): ReactNode {
  return <div className={css.slot} data-empty={empty ? 'true' : 'false'}>{empty ? null : children}</div>
}

/** Expert environment variables modal. */
export function EnvModal(props: EnvModalProps): ReactNode {
  const { t, open, expertId, source } = props
  const namesLocked = source === 'builtin'
  const [available, setAvailable] = useState<boolean | null>(null)
  const [keys, setKeys] = useState<readonly string[]>([])
  const [accepted, setAccepted] = useState<Record<string, Cell>>({})
  const [drafts, setDrafts] = useState<Record<string, Cell>>({ [NEW_KEY]: emptyCell() })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resetFromEntries = useCallback((entries: readonly ExpertEnvVar[]) => {
    const nextKeys: string[] = []
    const nextAccepted: Record<string, Cell> = {}
    const nextDrafts: Record<string, Cell> = { [NEW_KEY]: emptyCell() }
    for (const entry of entries) {
      const key = allocKey()
      nextKeys.push(key)
      const cell = { name: entry.name, value: entry.value }
      nextAccepted[key] = cell
      nextDrafts[key] = { ...cell }
    }
    setKeys(nextKeys)
    setAccepted(nextAccepted)
    setDrafts(nextDrafts)
  }, [])

  const reload = useCallback(async () => {
    if (expertId === '') return
    setLoading(true)
    setError('')
    try {
      const status = await props.customEnvStatus()
      setAvailable(status.available)
      resetFromEntries(await props.getEnv(expertId))
    } catch (err) {
      setError(formatRemoteError(err, t))
      setAvailable(false)
      resetFromEntries([])
    } finally {
      setLoading(false)
    }
  }, [expertId, props.customEnvStatus, props.getEnv, resetFromEntries, t])

  useEffect(() => {
    if (!open) {
      setAvailable(null)
      setKeys([])
      setAccepted({})
      setDrafts({ [NEW_KEY]: emptyCell() })
      setError('')
      setLoading(false)
      return
    }
    void reload()
  }, [open, reload])

  const taken = useMemo(() => {
    const names = new Set<string>()
    for (const key of keys) {
      const name = accepted[key]?.name.trim()
      if (name) names.add(name)
    }
    return names
  }, [keys, accepted])

  const missingPlugin = available === false
  const disabled = props.busy || loading || missingPlugin

  const setDraft = (key: string, patch: Partial<Cell>): void => {
    setDrafts(previous => ({
      ...previous,
      [key]: {
        name: patch.name ?? previous[key]?.name ?? '',
        value: patch.value ?? previous[key]?.value ?? '',
      },
    }))
  }

  const confirmRow = (key: string): void => {
    const draft = drafts[key] ?? emptyCell()
    if (namesLocked) {
      if (key === NEW_KEY) {
        setError(t('error.builtin-cannot-mutate-env'))
        return
      }
      const lockedName = accepted[key]?.name ?? ''
      const cell = { name: lockedName, value: draft.value }
      setError('')
      setAccepted(previous => ({ ...previous, [key]: cell }))
      setDrafts(previous => ({ ...previous, [key]: { ...cell } }))
      return
    }
    const name = draft.name.trim()
    if (name === '') {
      setError(t('env.validationName'))
      return
    }
    if (!NAME_OK.test(name)) {
      setError(t('env.validationName'))
      return
    }
    const previousName = key === NEW_KEY ? undefined : accepted[key]?.name.trim()
    if (name !== previousName && taken.has(name)) {
      setError(t('error.env-name-duplicate'))
      return
    }
    setError('')
    if (key === NEW_KEY) {
      const created = allocKey()
      const cell = { name, value: draft.value }
      setKeys(previous => [...previous, created])
      setAccepted(previous => ({ ...previous, [created]: cell }))
      setDrafts(previous => ({
        ...previous,
        [created]: { ...cell },
        [NEW_KEY]: emptyCell(),
      }))
      return
    }
    const cell = { name, value: draft.value }
    setAccepted(previous => ({ ...previous, [key]: cell }))
    setDrafts(previous => ({ ...previous, [key]: { ...cell } }))
  }

  const cancelRow = (key: string): void => {
    setError('')
    if (key === NEW_KEY) {
      setDrafts(previous => ({ ...previous, [NEW_KEY]: emptyCell() }))
      return
    }
    const cell = accepted[key] ?? emptyCell()
    setDrafts(previous => ({ ...previous, [key]: { ...cell } }))
  }

  const removeRow = (key: string): void => {
    if (namesLocked) {
      setError(t('error.builtin-cannot-mutate-env'))
      return
    }
    setError('')
    setKeys(previous => previous.filter(item => item !== key))
    setAccepted(previous => {
      const next = { ...previous }
      delete next[key]
      return next
    })
    setDrafts(previous => {
      const next = { ...previous }
      delete next[key]
      return next
    })
  }

  const save = async (): Promise<void> => {
    if (missingPlugin) {
      setError(t('env.pluginMissing'))
      return
    }
    // Build the persist payload from current drafts (row Confirm is local-only).
    const nextAccepted: Record<string, Cell> = {}
    const nextKeys: string[] = []
    for (const key of keys) {
      const draft = drafts[key] ?? accepted[key] ?? emptyCell()
      if (namesLocked) {
        const lockedName = accepted[key]?.name.trim() ?? ''
        if (lockedName === '') continue
        nextKeys.push(key)
        nextAccepted[key] = { name: lockedName, value: draft.value }
        continue
      }
      const name = draft.name.trim()
      if (name === '') continue
      nextKeys.push(key)
      nextAccepted[key] = { name, value: draft.value }
    }
    if (!namesLocked) {
      const newDraft = drafts[NEW_KEY] ?? emptyCell()
      if (newDraft.name.trim() !== '') {
        const created = allocKey()
        nextKeys.push(created)
        nextAccepted[created] = { name: newDraft.name.trim(), value: newDraft.value }
      }
    }
    const collected = collectEntries(nextKeys, nextAccepted)
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
      ? t('env.pluginMissing')
      : undefined

  const newDraft = drafts[NEW_KEY] ?? emptyCell()
  const newDirty = newDraft.name.trim() !== '' || newDraft.value !== ''
  const builtinEmpty = namesLocked && !loading && keys.length === 0
  const showPluginsCta = missingPlugin && props.openPlugins !== undefined && error === ''

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
          {builtinEmpty ? null : (
            <button
              type="button"
              className={css.primaryBtn}
              onClick={() => { void save() }}
              disabled={disabled}
            >
              {t('action.save')}
            </button>
          )}
        </div>
      )}
    >
      <div className={css.content}>
        {notice !== undefined ? (
          <div className={css.noticeRow} role="status">
            <p className={css.notice} data-tone="error">{notice}</p>
            {showPluginsCta ? (
              <button type="button" className={css.noticeCta} onClick={props.openPlugins}>
                {t('env.openPlugins')}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={css.header}>
          <p className={css.headerLabel}>{t('env.name')}</p>
          <p className={css.headerLabel}>{t('env.value')}</p>
          <div aria-hidden="true" />
        </div>

        {loading ? (
          <p className={css.empty}>{t('panel.loading')}</p>
        ) : namesLocked && keys.length === 0 ? (
          <p className={css.empty}>{t('env.builtinEmpty')}</p>
        ) : (
          <div className={css.list}>
            {keys.map(key => {
              const base = accepted[key] ?? emptyCell()
              const draft = drafts[key] ?? base
              const dirty = namesLocked
                ? draft.value !== base.value
                : draft.name !== base.name || draft.value !== base.value
              return (
                <div key={key} className={css.row}>
                  <Input
                    value={namesLocked ? base.name : draft.name}
                    disabled={disabled || namesLocked}
                    onChange={event => setDraft(key, { name: event.target.value })}
                    aria-label={t('env.name')}
                  />
                  <Input
                    value={draft.value}
                    disabled={disabled}
                    onChange={event => setDraft(key, { value: event.target.value })}
                    aria-label={t('env.value')}
                  />
                  <div className={css.actions} role="group" aria-label={t('env.actions')}>
                    <Slot empty={!dirty}>
                      {dirty ? (
                        <IconAction
                          label={t('action.confirm')}
                          primary
                          disabled={disabled}
                          onClick={() => confirmRow(key)}
                        >
                          <IconCheckOutlineRegular size={14} />
                        </IconAction>
                      ) : null}
                    </Slot>
                    <Slot empty={!dirty}>
                      {dirty ? (
                        <IconAction
                          label={t('action.cancel')}
                          disabled={disabled}
                          onClick={() => cancelRow(key)}
                        >
                          <IconCloseOutlineRegular size={14} />
                        </IconAction>
                      ) : null}
                    </Slot>
                    <Slot empty={namesLocked}>
                      {namesLocked ? null : (
                        <IconAction
                          label={t('action.delete')}
                          danger
                          disabled={disabled}
                          onClick={() => removeRow(key)}
                        >
                          <IconTrashOutlineRegular size={14} />
                        </IconAction>
                      )}
                    </Slot>
                  </div>
                </div>
              )
            })}

            {!namesLocked ? (
              <div className={css.row}>
                <Input
                  value={newDraft.name}
                  disabled={disabled}
                  onChange={event => setDraft(NEW_KEY, { name: event.target.value })}
                  placeholder={t('env.namePlaceholder')}
                  aria-label={t('env.name')}
                />
                <Input
                  value={newDraft.value}
                  disabled={disabled}
                  onChange={event => setDraft(NEW_KEY, { value: event.target.value })}
                  placeholder={t('env.valuePlaceholder')}
                  aria-label={t('env.value')}
                />
                <div className={css.actions} role="group" aria-label={t('env.actions')}>
                  <Slot empty={!newDirty}>
                    {newDirty ? (
                      <IconAction
                        label={t('action.confirm')}
                        primary
                        disabled={disabled}
                        onClick={() => confirmRow(NEW_KEY)}
                      >
                        <IconCheckOutlineRegular size={14} />
                      </IconAction>
                    ) : null}
                  </Slot>
                  <Slot empty={!newDirty}>
                    {newDirty ? (
                      <IconAction
                        label={t('action.cancel')}
                        disabled={disabled}
                        onClick={() => cancelRow(NEW_KEY)}
                      >
                        <IconCloseOutlineRegular size={14} />
                      </IconAction>
                    ) : null}
                  </Slot>
                  <Slot empty />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  )
}
