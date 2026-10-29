/** Expert env-var editor: draft Confirm/Cancel per row, syncs via custom-env. */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  IconCheckOutlineRegular,
  IconCloseOutlineRegular,
  IconLoadingOutlineRegular,
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
const NEW_ID = '__new__'

type Translate = (key: ExpertsKey) => string
type Draft = { name: string; value: string }
type BusyTarget = 'boot' | 'new' | `row:${string}` | 'delete'

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

function formatCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}

/** Expert environment variables modal. */
export function EnvModal(props: EnvModalProps): ReactNode {
  const { t, open, expertId } = props
  const [available, setAvailable] = useState<boolean | null>(null)
  const [committed, setCommitted] = useState<readonly ExpertEnvVar[]>([])
  const [rowIds, setRowIds] = useState<readonly string[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [busyTarget, setBusyTarget] = useState<BusyTarget | undefined>()
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const resetLocal = useCallback((entries: readonly ExpertEnvVar[]) => {
    const ids = entries.map((_, index) => `row-${index}`)
    const nextDrafts: Record<string, Draft> = { [NEW_ID]: { name: '', value: '' } }
    entries.forEach((entry, index) => {
      nextDrafts[ids[index]!] = { name: entry.name, value: entry.value }
    })
    setCommitted(entries)
    setRowIds(ids)
    setDrafts(nextDrafts)
  }, [])

  const reload = useCallback(async () => {
    if (expertId === '') return
    setBusyTarget('boot')
    setError('')
    setNameError(false)
    try {
      const status = await props.customEnvStatus()
      setAvailable(status.available)
      const entries = await props.getEnv(expertId)
      resetLocal(entries)
    } catch (err) {
      setError(formatRemoteError(err, t))
      setAvailable(false)
      resetLocal([])
    } finally {
      setBusyTarget(undefined)
    }
  }, [expertId, props.customEnvStatus, props.getEnv, resetLocal, t])

  useEffect(() => {
    if (!open) {
      setAvailable(null)
      setCommitted([])
      setRowIds([])
      setDrafts({ [NEW_ID]: { name: '', value: '' } })
      setError('')
      setNameError(false)
      setPendingDelete(null)
      setBusyTarget(undefined)
      return
    }
    void reload()
  }, [open, reload])

  const taken = useMemo(() => new Set(committed.map(entry => entry.name)), [committed])
  const globalBusy = props.busy || busyTarget !== undefined
  const missingPlugin = available === false

  const setDraft = (id: string, patch: Partial<Draft>): void => {
    setDrafts(previous => ({
      ...previous,
      [id]: {
        name: patch.name ?? previous[id]?.name ?? '',
        value: patch.value ?? previous[id]?.value ?? '',
      },
    }))
  }

  const persist = async (target: BusyTarget, next: readonly ExpertEnvVar[]): Promise<void> => {
    if (missingPlugin || busyTarget !== undefined) return
    setBusyTarget(target)
    props.setBusy(true)
    setError('')
    setNameError(false)
    try {
      await props.saveExpertEnv(expertId, next)
      resetLocal(next)
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      setBusyTarget(undefined)
      props.setBusy(false)
    }
  }

  const confirmRow = (id: string, previousName: string | undefined): void => {
    const draft = drafts[id] ?? { name: '', value: '' }
    const name = draft.name.trim()
    const takenByOther = name !== previousName && (
      id === NEW_ID ? taken.has(name) : committed.some(entry => entry.name === name && entry.name !== previousName)
    )
    if (!NAME_OK.test(name) || takenByOther) {
      setNameError(true)
      return
    }
    setNameError(false)
    let next: ExpertEnvVar[]
    if (id === NEW_ID) {
      next = [...committed, { name, value: draft.value }]
    } else {
      next = committed.map(entry => (
        entry.name === previousName ? { name, value: draft.value } : entry
      ))
    }
    void persist(id === NEW_ID ? 'new' : `row:${id}`, next)
  }

  const cancelRow = (id: string, snapshot: Draft): void => {
    setNameError(false)
    setDraft(id, snapshot)
  }

  const removeRow = (name: string): void => {
    const next = committed.filter(entry => entry.name !== name)
    void persist('delete', next).then(() => setPendingDelete(null))
  }

  const notice = error !== ''
    ? error
    : missingPlugin
      ? t('error.custom-env-missing')
      : nameError
        ? t('env.validationName')
        : undefined

  const newDraft = drafts[NEW_ID] ?? { name: '', value: '' }
  const newDirty = newDraft.name.trim() !== '' || newDraft.value !== ''
  const booting = busyTarget === 'boot'
  const title = props.expertLabel === '' ? t('env.title') : `${props.expertLabel} · ${t('env.title')}`

  return (
    <>
      <Modal
        open={open}
        onClose={props.onClose}
        title={title}
        closeLabel={t('action.close')}
        className={css.modal}
        footer={(
          <div className={css.footer}>
            <button type="button" className={css.ghostBtn} onClick={props.onClose} disabled={globalBusy}>
              {t('action.close')}
            </button>
          </div>
        )}
      >
        <div className={css.content}>
          <div className={css.summary}>
            <p className={css.count}>{formatCount(t('env.count'), committed.length)}</p>
            <p className={css.hint}>{t('env.hint')}</p>
          </div>

          {notice !== undefined ? (
            <p className={css.notice} role="status">{notice}</p>
          ) : null}

          <div className={css.list}>
            {committed.length > 0 ? (
              <div className={css.header}>
                <p className={css.headerLabel}>{t('env.name')}</p>
                <p className={css.headerLabel}>{t('env.value')}</p>
                <div aria-hidden="true" />
              </div>
            ) : null}

            {booting ? (
              <div className={css.empty}>
                <p className={css.emptyTitle}>{t('panel.loading')}</p>
              </div>
            ) : committed.length === 0 ? (
              <div className={css.empty}>
                <p className={css.emptyTitle}>{t('env.empty')}</p>
                <p className={css.emptyHint}>{t('env.emptyHint')}</p>
              </div>
            ) : null}

            {rowIds.map((id, index) => {
              const entry = committed[index]
              if (entry === undefined) return null
              const draft = drafts[id] ?? { name: entry.name, value: entry.value }
              const dirty = draft.name !== entry.name || draft.value !== entry.value
              const loading = busyTarget === `row:${id}`
              return (
                <div key={id} className={css.row} data-dirty={dirty ? 'true' : 'false'}>
                  <Input
                    className={css.nameInput}
                    value={draft.name}
                    disabled={globalBusy || missingPlugin}
                    onChange={event => setDraft(id, { name: event.target.value })}
                    aria-label={t('env.name')}
                  />
                  <Input
                    value={draft.value}
                    disabled={globalBusy || missingPlugin}
                    onChange={event => setDraft(id, { value: event.target.value })}
                    aria-label={t('env.value')}
                  />
                  <div className={css.actions} role="group" aria-label={t('env.actions')}>
                    <Slot empty={!dirty}>
                      {dirty ? (
                        <IconAction
                          label={loading ? t('panel.loading') : t('action.confirm')}
                          primary
                          disabled={globalBusy || missingPlugin}
                          onClick={() => confirmRow(id, entry.name)}
                        >
                          {loading
                            ? <IconLoadingOutlineRegular className={css.spinner} size={14} />
                            : <IconCheckOutlineRegular size={14} />}
                        </IconAction>
                      ) : null}
                    </Slot>
                    <Slot empty={!dirty}>
                      {dirty ? (
                        <IconAction
                          label={t('action.cancel')}
                          disabled={globalBusy}
                          onClick={() => cancelRow(id, { name: entry.name, value: entry.value })}
                        >
                          <IconCloseOutlineRegular size={14} />
                        </IconAction>
                      ) : null}
                    </Slot>
                    <Slot empty={false}>
                      <IconAction
                        label={t('action.delete')}
                        danger
                        disabled={globalBusy || missingPlugin || dirty}
                        onClick={() => setPendingDelete(entry.name)}
                      >
                        <IconTrashOutlineRegular size={14} />
                      </IconAction>
                    </Slot>
                  </div>
                </div>
              )
            })}
          </div>

          <div className={css.composer}>
            <p className={css.composerTitle}>{t('env.addSection')}</p>
            <div className={css.composerRow}>
              <Input
                className={css.nameInput}
                value={newDraft.name}
                disabled={globalBusy || missingPlugin || booting}
                onChange={event => setDraft(NEW_ID, { name: event.target.value })}
                placeholder={t('env.namePlaceholder')}
                aria-label={t('env.name')}
              />
              <Input
                value={newDraft.value}
                disabled={globalBusy || missingPlugin || booting}
                onChange={event => setDraft(NEW_ID, { value: event.target.value })}
                placeholder={t('env.valuePlaceholder')}
                aria-label={t('env.value')}
              />
              <div className={css.composerActions}>
                <button
                  type="button"
                  className={`${css.textBtn} ${css.textBtnPrimary}`}
                  disabled={globalBusy || missingPlugin || booting || !newDirty}
                  onClick={() => confirmRow(NEW_ID, undefined)}
                >
                  {busyTarget === 'new' ? t('panel.loading') : t('action.confirm')}
                </button>
                <button
                  type="button"
                  className={css.textBtn}
                  disabled={globalBusy || !newDirty}
                  onClick={() => cancelRow(NEW_ID, { name: '', value: '' })}
                >
                  {t('action.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('env.confirmDelete')}
        closeLabel={t('action.cancel')}
        footer={(
          <div className={css.footer}>
            <div className={css.composerActions}>
              <button type="button" className={css.textBtn} onClick={() => setPendingDelete(null)} disabled={globalBusy}>
                {t('action.cancel')}
              </button>
              <button
                type="button"
                className={`${css.textBtn} ${css.textBtnPrimary}`}
                onClick={() => {
                  if (pendingDelete !== null) removeRow(pendingDelete)
                }}
                disabled={globalBusy || missingPlugin}
              >
                {t('action.delete')}
              </button>
            </div>
          </div>
        )}
      >
        <p className={css.deleteBody}>
          {t('env.confirmDeleteBody')}
          {' '}
          <span className={css.deleteName}>{pendingDelete}</span>
        </p>
      </Modal>
    </>
  )
}
