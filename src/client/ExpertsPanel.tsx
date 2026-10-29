/** Main panel: expert list with edit / skills / skill-editor modals. */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Modal, Switch, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ExpertDetail, ExpertEnvVar, ExpertSource, ExpertSummary, SkillDetail } from '../types.ts'
import { AVATAR_CHOICES, DEFAULT_AVATAR } from './avatars.ts'
import { EnvModal } from './EnvModal.tsx'
import styles from './ExpertsPanel.module.css'
import { formatRemoteError } from './format-remote-error.ts'
import type { ExpertsKey } from './locales.ts'
import { MarkdownField } from './MarkdownField.tsx'

/** Document + spark — manage skills. */
function IconSkills(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <path d="M4.58 5.77h6.12M4.58 8.9h3.34" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path
        d="M12.14 1.19c.8 0 1.5.63 1.5 1.45v6.25h-1V2.64c0-.22-.2-.45-.5-.45H3.14c-.3 0-.5.23-.5.45v10.45c0 .22.2.45.5.45h5.74v1H3.14c-.8 0-1.5-.63-1.5-1.45V2.64c0-.82.7-1.45 1.5-1.45h9Z"
        fill="currentColor"
      />
      <path
        d="M12.01 15.11c0-1.47-1.19-2.66-2.66-2.66 1.47 0 2.66-1.19 2.66-2.65 0 1.46 1.19 2.65 2.65 2.65-1.46 0-2.65 1.19-2.65 2.66Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconEdit(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5 17.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconEnv(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11.25 12H20M16.5 9.5V14.5M19 9.5V14.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconPlus(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch(): ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconImport(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4H7.5A2.5 2.5 0 0 0 5 6.5v10A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5V15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 4v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 8.5 16 11.5 19 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconExport(): ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 4h6v6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 4 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M11 5H7.5A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5V13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconHelp(): ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M6.1 6.3a2.1 2.1 0 0 1 3.7 1.3c0 1.1-.9 1.6-1.6 2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M8 11.3v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export interface ExpertsPanelInjected {
  readonly t: (key: ExpertsKey) => string
  readonly list: () => Promise<readonly ExpertSummary[]>
  readonly get: (id: string) => Promise<ExpertDetail>
  readonly saveExpert: (input: {
    id?: string
    name: string
    description: string
    avatar: string
    persona: string
  }) => Promise<ExpertDetail>
  readonly deleteExpert: (id: string) => Promise<void>
  readonly setEnabled: (id: string, enabled: boolean) => Promise<ExpertDetail>
  readonly getSkill: (expertId: string, skillName: string) => Promise<SkillDetail>
  readonly saveSkill: (expertId: string, input: {
    name: string
    description: string
    prompt: string
    fromName?: string
  }) => Promise<SkillDetail>
  readonly deleteSkill: (expertId: string, skillName: string) => Promise<void>
  readonly importZip: (expertId: string, zipBase64: string) => Promise<{ imported: readonly string[] }>
  readonly exportExpert: (id: string) => Promise<{ filename: string; zipBase64: string }>
  readonly exportExperts: (ids: readonly string[]) => Promise<{ filename: string; zipBase64: string }>
  readonly importExpert: (zipBase64: string) => Promise<{ count: number; ids: readonly string[] }>
  readonly customEnvStatus: () => Promise<{ available: boolean }>
  readonly saveExpertEnv: (id: string, entries: readonly ExpertEnvVar[]) => Promise<ExpertDetail>
}

type SourceFilter = 'all' | ExpertSource
type StatusFilter = 'all' | 'enabled' | 'disabled'

type ExpertDialog =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; id: string }

type SkillsDialog =
  | { kind: 'closed' }
  | { kind: 'open'; id: string }

type EnvDialog =
  | { kind: 'closed' }
  | { kind: 'open'; id: string }

type SkillDialog =
  | { kind: 'closed' }
  | { kind: 'create'; expertId: string }
  | { kind: 'edit'; expertId: string; skillName: string }

/** Skill experts management panel. */
function downloadBase64Zip(filename: string, zipBase64: string): void {
  const binary = atob(zipBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ExpertsPanel({
  t, list, get, saveExpert, deleteExpert, setEnabled, getSkill, saveSkill, deleteSkill, importZip,
  exportExpert, exportExperts, importExpert, customEnvStatus, saveExpertEnv,
}: ExpertsPanelInjected): ReactNode {
  const [dialog, setDialog] = useState<ExpertDialog>({ kind: 'closed' })
  const [skillsDialog, setSkillsDialog] = useState<SkillsDialog>({ kind: 'closed' })
  const [envDialog, setEnvDialog] = useState<EnvDialog>({ kind: 'closed' })
  const [skillDialog, setSkillDialog] = useState<SkillDialog>({ kind: 'closed' })
  const [skillsTick, setSkillsTick] = useState(0)
  const [rows, setRows] = useState<readonly ExpertSummary[] | null>(null)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [manageMode, setManageMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const importExpertInputRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(async () => {
    setError('')
    try {
      setRows(await list())
    } catch (err) {
      setError(formatRemoteError(err, t))
      setRows([])
    }
  }, [list, t])

  useEffect(() => { void reload() }, [reload])

  const filtered = useMemo(() => {
    if (rows === null) return null
    const needle = query.trim().toLowerCase()
    return rows.filter(row => {
      if (sourceFilter !== 'all' && row.source !== sourceFilter) return false
      if (statusFilter === 'enabled' && !row.enabled) return false
      if (statusFilter === 'disabled' && row.enabled) return false
      if (needle === '') return true
      const haystack = `${row.name}\n${row.description}\n${row.id}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [rows, query, sourceFilter, statusFilter])

  // Manage mode only selects custom experts; built-ins stay non-checkable.
  const selectableFilteredIds = useMemo(
    () => (filtered ?? []).filter(row => row.source === 'custom').map(row => row.id),
    [filtered],
  )
  const allFilteredSelected = selectableFilteredIds.length > 0
    && selectableFilteredIds.every(id => selectedIds.has(id))

  useEffect(() => {
    if (!manageMode) return
    const allowed = new Set(selectableFilteredIds)
    setSelectedIds(current => {
      let changed = false
      const next = new Set<string>()
      for (const id of current) {
        if (allowed.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : current
    })
  }, [manageMode, selectableFilteredIds])

  const exitManageMode = () => {
    setManageMode(false)
    setSelectedIds(new Set())
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(selectableFilteredIds))
  }

  const toggleSelected = (id: string) => {
    const row = (rows ?? []).find(item => item.id === id)
    if (row === undefined || row.source !== 'custom') return
    setSelectedIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggle = async (row: ExpertSummary) => {
    setTogglingId(row.id)
    setError('')
    try {
      const next = await setEnabled(row.id, !row.enabled)
      setRows(current => (current ?? []).map(item => (
        item.id === next.id
          ? {
            id: next.id,
            name: next.name,
            description: next.description,
            avatar: next.avatar,
            skillCount: next.skillCount,
            presetId: next.presetId,
            source: next.source,
            enabled: next.enabled,
          }
          : item
      )))
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      setTogglingId(null)
    }
  }

  const onExportExpert = async (id: string) => {
    setBusy(true)
    setError('')
    try {
      const pack = await exportExpert(id)
      downloadBase64Zip(pack.filename, pack.zipBase64)
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      setBusy(false)
    }
  }

  const onImportExpertFile = async (file: File | undefined) => {
    if (file === undefined) return
    setBusy(true)
    setError('')
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      let binary = ''
      for (const byte of buffer) binary += String.fromCharCode(byte)
      await importExpert(btoa(binary))
      await reload()
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      setBusy(false)
    }
  }

  const onExportSelected = async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    setBusy(true)
    setError('')
    try {
      const pack = await exportExperts(ids)
      downloadBase64Zip(pack.filename, pack.zipBase64)
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      setBusy(false)
    }
  }

  const onDeleteSelected = async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    const confirmText = t('manage.confirmDeleteSelected').replace('{count}', String(ids.length))
    if (!window.confirm(confirmText)) return
    setBusy(true)
    setError('')
    try {
      for (const id of ids) {
        await deleteExpert(id)
      }
      setSelectedIds(new Set())
      await reload()
    } catch (err) {
      setError(formatRemoteError(err, t))
      await reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <select
            className={sourceFilter === 'all' ? styles.filter : styles.filterActive}
            value={sourceFilter}
            aria-label={t('filter.sourceAll')}
            onChange={e => setSourceFilter(e.target.value as SourceFilter)}
          >
            <option value="all">{t('filter.sourceAll')}</option>
            <option value="builtin">{t('filter.sourceBuiltin')}</option>
            <option value="custom">{t('filter.sourceCustom')}</option>
          </select>
          <select
            className={statusFilter === 'all' ? styles.filter : styles.filterActive}
            value={statusFilter}
            aria-label={t('filter.statusAll')}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">{t('filter.statusAll')}</option>
            <option value="enabled">{t('filter.statusEnabled')}</option>
            <option value="disabled">{t('filter.statusDisabled')}</option>
          </select>
        </div>
        <input
          ref={importExpertInputRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={e => {
            const file = e.target.files?.[0]
            e.target.value = ''
            void onImportExpertFile(file)
          }}
        />
        <label className={styles.search}>
          <span className={styles.searchIcon}><IconSearch /></span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('panel.searchPlaceholder')}
            aria-label={t('panel.searchPlaceholder')}
          />
        </label>
        <button
          type="button"
          className={styles.addBtn}
          disabled={busy}
          onClick={() => importExpertInputRef.current?.click()}
          aria-label={t('expert.import')}
          title={t('expert.import')}
        >
          <IconImport />
        </button>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setDialog({ kind: 'create' })}
          aria-label={t('action.new')}
          title={t('action.new')}
        >
          <IconPlus />
        </button>
      </div>
      <div className={styles.manageBar}>
        {manageMode ? (
          <>
            <label className={styles.manageSelectAll}>
              <input
                type="checkbox"
                checked={allFilteredSelected}
                disabled={selectableFilteredIds.length === 0 || busy}
                onChange={toggleSelectAll}
              />
              <span>
                {allFilteredSelected ? t('manage.clearSelection') : t('manage.selectAll')}
              </span>
            </label>
            <div className={styles.manageActions}>
              <button
                type="button"
                className={styles.manageExportBtn}
                disabled={selectedIds.size === 0 || busy}
                onClick={() => { void onExportSelected() }}
              >
                {t('manage.exportSelected')}
              </button>
              <button
                type="button"
                className={styles.manageDeleteBtn}
                disabled={selectedIds.size === 0 || busy}
                onClick={() => { void onDeleteSelected() }}
              >
                {t('manage.deleteSelected')}
              </button>
            </div>
          </>
        ) : <span />}
        <button
          type="button"
          className={styles.manageToggleBtn}
          disabled={busy}
          onClick={() => {
            if (manageMode) exitManageMode()
            else setManageMode(true)
          }}
        >
          {manageMode ? t('manage.exit') : t('manage.enter')}
        </button>
      </div>
      {error !== '' && <div className={styles.error}>{error}</div>}
      {filtered === null ? (
        <div className={styles.muted}>{t('panel.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.muted}>{rows !== null && rows.length > 0 ? t('panel.emptySearch') : t('panel.empty')}</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(row => (
            <article key={row.id} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIdentity}>
                    {manageMode && row.source === 'custom' && (
                      <input
                        type="checkbox"
                        className={styles.cardSelect}
                        checked={selectedIds.has(row.id)}
                        disabled={busy}
                        aria-label={row.name}
                        onChange={() => toggleSelected(row.id)}
                      />
                    )}
                    <span className={styles.cardAvatar} aria-hidden="true">{row.avatar}</span>
                    <div className={styles.cardIdentityText}>
                      <div className={styles.cardName} title={row.name}>{row.name}</div>
                      <div className={styles.cardTags}>
                        <span className={styles.cardTag}>
                          {row.source === 'builtin' ? t('source.builtin') : t('source.custom')}
                        </span>
                        <span className={styles.cardTag}>
                          {t('skill.count').replace('{count}', String(row.skillCount))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.cardSwitch}>
                    <Switch
                      checked={row.enabled}
                      disabled={togglingId === row.id || busy}
                      label={`${row.name}: ${row.enabled ? t('status.enabled') : t('status.disabled')}`}
                      title={t('status.toggleEnable')}
                      onChange={() => { void toggle(row) }}
                    />
                    <span className={styles.cardSwitchLabel}>
                      {row.enabled ? t('status.enabled') : t('status.disabled')}
                    </span>
                  </div>
                </div>
                {row.description !== '' && (
                  <p className={styles.cardDescription} title={row.description}>
                    {row.description}
                  </p>
                )}
                <div className={styles.cardMeta}>
                  <button
                    type="button"
                    className={styles.cardExport}
                    disabled={busy}
                    aria-label={t('expert.export')}
                    title={t('expert.export')}
                    onClick={() => { void onExportExpert(row.id) }}
                  >
                    <IconExport />
                  </button>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.cardAction}
                  aria-label={t('expert.manageSkills')}
                  title={t('expert.manageSkills')}
                  onClick={() => setSkillsDialog({ kind: 'open', id: row.id })}
                >
                  <IconSkills />
                </button>
                <button
                  type="button"
                  className={styles.cardAction}
                  aria-label={t('expert.edit')}
                  title={t('expert.edit')}
                  onClick={() => setDialog({ kind: 'edit', id: row.id })}
                >
                  <IconEdit />
                </button>
                <button
                  type="button"
                  className={styles.cardAction}
                  aria-label={t('expert.editEnv')}
                  title={t('expert.editEnv')}
                  onClick={() => setEnvDialog({ kind: 'open', id: row.id })}
                >
                  <IconEnv />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <ExpertModal
        t={t}
        dialog={dialog}
        get={get}
        saveExpert={saveExpert}
        deleteExpert={deleteExpert}
        busy={busy}
        setBusy={setBusy}
        onClose={() => setDialog({ kind: 'closed' })}
        onSaved={async () => {
          setDialog({ kind: 'closed' })
          await reload()
        }}
        onDeleted={async () => {
          setDialog({ kind: 'closed' })
          setSkillsDialog({ kind: 'closed' })
          setEnvDialog({ kind: 'closed' })
          setSkillDialog({ kind: 'closed' })
          await reload()
        }}
      />
      <EnvModal
        t={t}
        open={envDialog.kind === 'open'}
        expertId={envDialog.kind === 'open' ? envDialog.id : ''}
        expertLabel={(() => {
          if (envDialog.kind !== 'open' || rows === null) return ''
          const row = rows.find(item => item.id === envDialog.id)
          return row === undefined ? '' : `${row.avatar} ${row.name}`
        })()}
        getEnv={async id => (await get(id)).envVars}
        customEnvStatus={customEnvStatus}
        saveExpertEnv={async (id, entries) => {
          await saveExpertEnv(id, entries)
        }}
        busy={busy}
        setBusy={setBusy}
        onClose={() => setEnvDialog({ kind: 'closed' })}
      />
      <SkillsModal
        t={t}
        dialog={skillsDialog}
        refreshKey={skillsTick}
        get={get}
        importZip={importZip}
        busy={busy}
        setBusy={setBusy}
        onClose={() => {
          setSkillDialog({ kind: 'closed' })
          setSkillsDialog({ kind: 'closed' })
          void reload()
        }}
        onOpenSkill={(expertId, skillName) => setSkillDialog({ kind: 'edit', expertId, skillName })}
        onNewSkill={expertId => setSkillDialog({ kind: 'create', expertId })}
      />
      <SkillModal
        t={t}
        dialog={skillDialog}
        get={get}
        getSkill={getSkill}
        saveSkill={saveSkill}
        deleteSkill={deleteSkill}
        busy={busy}
        setBusy={setBusy}
        onClose={() => {
          setSkillDialog({ kind: 'closed' })
          setSkillsTick(n => n + 1)
        }}
      />
    </div>
  )
}

function ExpertModal(props: {
  t: ExpertsPanelInjected['t']
  dialog: ExpertDialog
  get: ExpertsPanelInjected['get']
  saveExpert: ExpertsPanelInjected['saveExpert']
  deleteExpert: ExpertsPanelInjected['deleteExpert']
  busy: boolean
  setBusy: (v: boolean) => void
  onClose: () => void
  onSaved: (detail: ExpertDetail) => void | Promise<void>
  onDeleted: () => void | Promise<void>
}): ReactNode {
  const { t, dialog } = props
  const open = dialog.kind !== 'closed'
  const editingId = dialog.kind === 'edit' ? dialog.id : undefined
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)
  const [persona, setPersona] = useState('')
  const [source, setSource] = useState<ExpertSource>('custom')
  const [error, setError] = useState('')
  const [loadedId, setLoadedId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setError('')
    if (editingId === undefined) {
      setName('')
      setDescription('')
      setAvatar(DEFAULT_AVATAR)
      setPersona('')
      setSource('custom')
      setLoadedId(undefined)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const detail = await props.get(editingId)
        if (cancelled) return
        setLoadedId(detail.id)
        setName(detail.name)
        setDescription(detail.description)
        setAvatar(detail.avatar)
        setPersona(detail.persona)
        setSource(detail.source)
      } catch (err) {
        if (!cancelled) setError(formatRemoteError(err, t))
      }
    })()
    return () => { cancelled = true }
  }, [open, editingId, props.get, t])

  const choices = AVATAR_CHOICES.includes(avatar) ? AVATAR_CHOICES : [avatar, ...AVATAR_CHOICES]

  const save = async () => {
    if (name.trim() === '' || persona.trim() === '') {
      setError(t('expert.validationRequired'))
      return
    }
    props.setBusy(true)
    setError('')
    try {
      const detail = await props.saveExpert({
        ...loadedId === undefined ? {} : { id: loadedId },
        name: name.trim(),
        description: description.trim(),
        avatar,
        persona: persona.trim(),
      })
      await props.onSaved(detail)
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      props.setBusy(false)
    }
  }

  const remove = async () => {
    if (loadedId === undefined) { props.onClose(); return }
    if (source === 'builtin') {
      setError(t('expert.cannotDeleteBuiltin'))
      return
    }
    if (!window.confirm(t('expert.confirmDelete'))) return
    props.setBusy(true)
    setError('')
    try {
      await props.deleteExpert(loadedId)
      await props.onDeleted()
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      props.setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={props.onClose}
      title={editingId === undefined ? t('expert.modalNewTitle') : t('expert.modalEditTitle')}
      closeLabel={t('action.close')}
      className={styles.modal}
      contentClassName={styles.modalContent}
      footer={(
        <div className={styles.modalFooter}>
          <button type="button" className={styles.ghostBtn} onClick={props.onClose} disabled={props.busy}>
            {t('action.cancel')}
          </button>
          <div className={styles.modalFooterRight}>
            {loadedId !== undefined && source === 'custom' && (
              <button type="button" className={styles.dangerBtn} onClick={() => void remove()} disabled={props.busy}>
                {t('action.delete')}
              </button>
            )}
            <button type="button" className={styles.primaryBtn} onClick={() => void save()} disabled={props.busy}>
              {t('action.save')}
            </button>
          </div>
        </div>
      )}
    >
      {error !== '' && <div className={styles.error}>{error}</div>}
      {loadedId !== undefined && (
        <div className={styles.field}>
          <div className={styles.fieldLabelRow}>
            <span className={styles.cardTag}>
              {source === 'builtin' ? t('source.builtin') : t('source.custom')}
            </span>
          </div>
        </div>
      )}
      <div className={styles.field}>
        <div className={styles.fieldLabelRow}>
          <span>{t('expert.avatar')}</span>
        </div>
        <div className={styles.avatarGrid} role="listbox" aria-label={t('expert.avatar')}>
          {choices.map(glyph => {
            const selected = glyph === avatar
            return (
              <button
                key={glyph}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={selected ? `${glyph} ${t('expert.avatarSelected')}` : glyph}
                className={selected ? styles.avatarChoiceSelected : styles.avatarChoice}
                onClick={() => setAvatar(glyph)}
              >
                <span className={styles.avatarGlyph}>{glyph}</span>
                {selected && <span className={styles.avatarCheck} aria-hidden="true">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="se-name">
          {t('expert.name')}
          <span className={styles.required}>{t('field.requiredMark')}</span>
        </label>
        <input
          id="se-name"
          data-modal-autofocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('expert.name')}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="se-description">{t('expert.description')}</label>
        <textarea
          id="se-description"
          className={styles.shortTextarea}
          rows={1}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('expert.description')}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="se-persona-textarea">
          {t('expert.persona')}
          <span className={styles.required}>{t('field.requiredMark')}</span>
        </label>
        <MarkdownField
          id="se-persona"
          aria-label={t('expert.persona')}
          value={persona}
          onChange={setPersona}
          placeholder={t('expert.persona')}
          disabled={props.busy}
          height={240}
        />
      </div>
    </Modal>
  )
}

function SkillsModal(props: {
  t: ExpertsPanelInjected['t']
  dialog: SkillsDialog
  refreshKey: number
  get: ExpertsPanelInjected['get']
  importZip: ExpertsPanelInjected['importZip']
  busy: boolean
  setBusy: (v: boolean) => void
  onClose: () => void
  onOpenSkill: (expertId: string, skillName: string) => void
  onNewSkill: (expertId: string) => void
}): ReactNode {
  const { t, dialog } = props
  const open = dialog.kind === 'open'
  const expertId = dialog.kind === 'open' ? dialog.id : ''
  const [detail, setDetail] = useState<ExpertDetail | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = useCallback(async () => {
    if (expertId === '') return
    setError('')
    try {
      setDetail(await props.get(expertId))
    } catch (err) {
      setError(formatRemoteError(err, t))
    }
  }, [expertId, props.get, t])

  useEffect(() => {
    if (!open) {
      setDetail(null)
      setError('')
      return
    }
    void reload()
  }, [open, reload, props.refreshKey])

  const onZip = async (file: File | undefined) => {
    if (file === undefined || expertId === '') return
    props.setBusy(true)
    setError('')
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      let binary = ''
      for (const byte of buffer) binary += String.fromCharCode(byte)
      await props.importZip(expertId, btoa(binary))
      await reload()
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      props.setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const title = detail === null
    ? t('expert.manageSkills')
    : `${detail.avatar} ${detail.name} · ${t('expert.manageSkills')}`

  return (
    <Modal
      open={open}
      onClose={props.onClose}
      title={title}
      closeLabel={t('action.close')}
      className={styles.skillsModal}
      contentClassName={styles.modalContent}
      footer={(
        <div className={styles.modalFooter}>
          <button type="button" className={styles.ghostBtn} onClick={props.onClose} disabled={props.busy}>
            {t('action.close')}
          </button>
          <div className={styles.modalFooterRight}>
            {expertId !== '' && detail?.source === 'custom' && (
              <>
                <div className={styles.importSkillsBtn}>
                  <button
                    type="button"
                    className={styles.importSkillsMain}
                    onClick={() => fileRef.current?.click()}
                    disabled={props.busy}
                  >
                    {t('skill.importZip')}
                  </button>
                  <Tooltip label={t('skill.importZipHelp')} side="top" portal maxWidth={320} openOnClick>
                    <button
                      type="button"
                      className={styles.helpBtn}
                      aria-label={t('skill.importZipHelpLabel')}
                      disabled={props.busy}
                    >
                      <IconHelp />
                    </button>
                  </Tooltip>
                </div>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => props.onNewSkill(expertId)}
                  disabled={props.busy}
                >
                  {t('skill.add')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={e => void onZip(e.target.files?.[0])}
      />
      {error !== '' && <div className={styles.error}>{error}</div>}
      {detail === null ? (
        <div className={styles.muted}>{t('panel.loading')}</div>
      ) : detail.skills.length === 0 ? (
        <div className={styles.muted}>{t('skill.none')}</div>
      ) : (
        <div className={styles.skillsTableWrap}>
          <table className={styles.skillsTable}>
            <thead>
              <tr>
                <th className={styles.skillIndexCell}>{t('skill.index')}</th>
                <th>{t('skill.name')}</th>
                <th>{t('skill.description')}</th>
              </tr>
            </thead>
            <tbody>
              {[...detail.skills]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((skill, index) => (
                  <tr
                    key={skill.name}
                    className={styles.skillRow}
                    onClick={() => props.onOpenSkill(expertId, skill.name)}
                  >
                    <td className={styles.skillIndexCell}>{`#${index + 1}`}</td>
                    <td className={styles.skillNameCell}>{skill.name}</td>
                    <td>{skill.description}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

function SkillModal(props: {
  t: ExpertsPanelInjected['t']
  dialog: SkillDialog
  get: ExpertsPanelInjected['get']
  getSkill: ExpertsPanelInjected['getSkill']
  saveSkill: ExpertsPanelInjected['saveSkill']
  deleteSkill: ExpertsPanelInjected['deleteSkill']
  busy: boolean
  setBusy: (v: boolean) => void
  onClose: () => void
}): ReactNode {
  const { t, dialog } = props
  const open = dialog.kind !== 'closed'
  const expertId = dialog.kind === 'closed' ? '' : dialog.expertId
  const skillName = dialog.kind === 'edit' ? dialog.skillName : undefined
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState('')
  const [absolutePath, setAbsolutePath] = useState('')
  const [extraFiles, setExtraFiles] = useState<readonly string[]>([])
  const [fromName, setFromName] = useState<string | undefined>(undefined)
  const [expertSource, setExpertSource] = useState<ExpertSource | null>(null)
  const [error, setError] = useState('')
  const builtinExpert = expertSource === 'builtin'

  useEffect(() => {
    if (!open) return
    setError('')
    setExpertSource(null)
    if (skillName === undefined) {
      setName('')
      setDescription('')
      setPrompt('')
      setAbsolutePath('')
      setExtraFiles([])
      setFromName(undefined)
      let cancelled = false
      void (async () => {
        try {
          const expert = await props.get(expertId)
          if (!cancelled) setExpertSource(expert.source)
        } catch (err) {
          if (!cancelled) setError(formatRemoteError(err, t))
        }
      })()
      return () => { cancelled = true }
    }
    let cancelled = false
    void (async () => {
      try {
        const [detail, expert] = await Promise.all([
          props.getSkill(expertId, skillName),
          props.get(expertId),
        ])
        if (cancelled) return
        setName(detail.name)
        setDescription(detail.description)
        setPrompt(detail.prompt)
        setAbsolutePath(detail.absolutePath)
        setExtraFiles(detail.extraFiles)
        setFromName(detail.name)
        setExpertSource(expert.source)
      } catch (err) {
        if (!cancelled) setError(formatRemoteError(err, t))
      }
    })()
    return () => { cancelled = true }
  }, [open, expertId, skillName, props.get, props.getSkill, t])

  const save = async () => {
    if (expertId === '') return
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()
    const trimmedPrompt = prompt.trim()
    if (trimmedName === '' || trimmedDescription === '' || trimmedPrompt === '') {
      setError(t('skill.validationRequired'))
      return
    }
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(trimmedName)) {
      setError(t('skill.validationNameKebab'))
      return
    }
    props.setBusy(true)
    setError('')
    try {
      const detail = await props.saveSkill(expertId, {
        name: trimmedName,
        description: trimmedDescription,
        prompt: trimmedPrompt,
        ...fromName === undefined || fromName === trimmedName ? {} : { fromName },
      })
      setFromName(detail.name)
      setAbsolutePath(detail.absolutePath)
      setExtraFiles(detail.extraFiles)
      props.onClose()
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      props.setBusy(false)
    }
  }

  const remove = async () => {
    if (builtinExpert) {
      setError(t('error.builtin-cannot-delete-skill'))
      return
    }
    if (fromName === undefined || expertId === '') {
      props.onClose()
      return
    }
    if (!window.confirm(t('skill.confirmDelete'))) return
    props.setBusy(true)
    try {
      await props.deleteSkill(expertId, fromName)
      props.onClose()
    } catch (err) {
      setError(formatRemoteError(err, t))
    } finally {
      props.setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={props.onClose}
      title={skillName === undefined ? t('skill.add') : t('skill.edit')}
      closeLabel={t('action.close')}
      className={styles.modal}
      contentClassName={styles.modalContent}
      footer={(
        <div className={styles.modalFooter}>
          <button type="button" className={styles.ghostBtn} onClick={props.onClose} disabled={props.busy}>
            {t('action.cancel')}
          </button>
          <div className={styles.modalFooterRight}>
            {fromName !== undefined && !builtinExpert && (
              <button type="button" className={styles.dangerBtn} onClick={() => void remove()} disabled={props.busy}>
                {t('action.delete')}
              </button>
            )}
            <button type="button" className={styles.primaryBtn} onClick={() => void save()} disabled={props.busy}>
              {t('action.save')}
            </button>
          </div>
        </div>
      )}
    >
      {error !== '' && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label htmlFor="sk-name">
          {t('skill.name')}
          <span className={styles.required}>{t('field.requiredMark')}</span>
        </label>
        <input
          id="sk-name"
          data-modal-autofocus={!builtinExpert}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('skill.namePlaceholder')}
          readOnly={builtinExpert}
          disabled={builtinExpert}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="sk-desc">
          {t('skill.description')}
          <span className={styles.required}>{t('field.requiredMark')}</span>
        </label>
        <input
          id="sk-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t('skill.description')}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="sk-prompt-textarea">
          {t('skill.prompt')}
          <span className={styles.required}>{t('field.requiredMark')}</span>
        </label>
        <MarkdownField
          id="sk-prompt"
          aria-label={t('skill.prompt')}
          value={prompt}
          onChange={setPrompt}
          placeholder={t('skill.prompt')}
          disabled={props.busy}
          height={220}
        />
      </div>
      {absolutePath !== '' && (
        <div className={styles.field}>
          <label>{t('skill.path')}</label>
          <div className={styles.path}>{absolutePath}</div>
        </div>
      )}
      {groupExtraFiles(extraFiles).map(group => (
        <div key={group.id} className={styles.field}>
          <label>{t(group.labelKey)}</label>
          <ul className={styles.files}>
            {group.files.map(file => <li key={file}>{file}</li>)}
          </ul>
        </div>
      ))}
    </Modal>
  )
}

type ExtraFileGroupId = 'scripts' | 'references' | 'assets' | 'other'

type ExtraFileGroup = {
  readonly id: ExtraFileGroupId
  readonly labelKey:
    | 'skill.files.scripts'
    | 'skill.files.references'
    | 'skill.files.assets'
    | 'skill.files.other'
  readonly files: readonly string[]
}

const EXTRA_FILE_GROUP_ORDER: readonly ExtraFileGroupId[] = ['scripts', 'references', 'assets', 'other']

function classifyExtraFile(path: string): ExtraFileGroupId {
  const top = path.split('/', 1)[0]
  if (top === 'scripts') return 'scripts'
  if (top === 'references') return 'references'
  if (top === 'assets') return 'assets'
  return 'other'
}

function groupExtraFiles(files: readonly string[]): readonly ExtraFileGroup[] {
  const buckets: Record<ExtraFileGroupId, string[]> = {
    scripts: [],
    references: [],
    assets: [],
    other: [],
  }
  for (const file of files) buckets[classifyExtraFile(file)].push(file)
  return EXTRA_FILE_GROUP_ORDER.flatMap(id => {
    const groupFiles = buckets[id]
    if (groupFiles.length === 0) return []
    const labelKey =
      id === 'scripts' ? 'skill.files.scripts'
      : id === 'references' ? 'skill.files.references'
      : id === 'assets' ? 'skill.files.assets'
      : 'skill.files.other'
    return [{ id, labelKey, files: groupFiles }]
  })
}
