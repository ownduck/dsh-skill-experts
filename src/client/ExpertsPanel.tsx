/** Main panel: expert list, editor, skill table / editor, zip import. */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { ExpertDetail, ExpertSummary, SkillDetail, SkillSummary } from '../types.ts'
import styles from './ExpertsPanel.module.css'
import type { ExpertsKey } from './locales.ts'

export interface ExpertsPanelInjected {
  readonly t: (key: ExpertsKey) => string
  readonly list: () => Promise<readonly ExpertSummary[]>
  readonly get: (id: string) => Promise<ExpertDetail>
  readonly saveExpert: (input: {
    id?: string
    name: string
    avatar: string
    persona: string
  }) => Promise<ExpertDetail>
  readonly deleteExpert: (id: string) => Promise<void>
  readonly getSkill: (expertId: string, skillName: string) => Promise<SkillDetail>
  readonly saveSkill: (expertId: string, input: {
    name: string
    description: string
    prompt: string
    note?: string
    fromName?: string
  }) => Promise<SkillDetail>
  readonly deleteSkill: (expertId: string, skillName: string) => Promise<void>
  readonly importZip: (expertId: string, zipBase64: string) => Promise<{ imported: readonly string[] }>
}

type View =
  | { kind: 'list' }
  | { kind: 'expert'; id?: string }
  | { kind: 'skill'; expertId: string; skillName?: string }

/** Skill experts management panel. */
export function ExpertsPanel({ t, list, get, saveExpert, deleteExpert, getSkill, saveSkill, deleteSkill, importZip }: ExpertsPanelInjected): ReactNode {
  const [view, setView] = useState<View>({ kind: 'list' })
  const [rows, setRows] = useState<readonly ExpertSummary[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    setError('')
    try {
      setRows(await list())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
      setRows([])
    }
  }, [list, t])

  useEffect(() => { void reload() }, [reload])

  if (view.kind === 'expert') {
    return (
      <ExpertEditor
        t={t}
        expertId={view.id}
        get={get}
        saveExpert={saveExpert}
        deleteExpert={deleteExpert}
        getSkill={getSkill}
        saveSkill={saveSkill}
        deleteSkill={deleteSkill}
        importZip={importZip}
        busy={busy}
        setBusy={setBusy}
        onBack={() => { setView({ kind: 'list' }); void reload() }}
        onOpenSkill={(expertId, skillName) => setView({ kind: 'skill', expertId, skillName })}
        onNewSkill={expertId => setView({ kind: 'skill', expertId })}
      />
    )
  }

  if (view.kind === 'skill') {
    return (
      <SkillEditor
        t={t}
        expertId={view.expertId}
        skillName={view.skillName}
        getSkill={getSkill}
        saveSkill={saveSkill}
        deleteSkill={deleteSkill}
        busy={busy}
        setBusy={setBusy}
        onBack={() => setView({ kind: 'expert', id: view.expertId })}
      />
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <button type="button" onClick={() => setView({ kind: 'expert' })}>{t('new')}</button>
      </div>
      {error !== '' && <div className={styles.error}>{error}</div>}
      {rows === null ? <div className={styles.muted}>{t('loading')}</div> : rows.length === 0 ? (
        <div className={styles.muted}>{t('empty')}</div>
      ) : (
        <div className={styles.list}>
          {rows.map(row => (
            <button key={row.id} type="button" className={styles.row} onClick={() => setView({ kind: 'expert', id: row.id })}>
              <span className={styles.avatar}>{row.avatar}</span>
              <span className={styles.meta}>
                <div className={styles.name}>{row.name}</div>
                <div className={styles.sub}>{row.skillCount} · {row.id}</div>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpertEditor(props: {
  t: ExpertsPanelInjected['t']
  expertId?: string
  get: ExpertsPanelInjected['get']
  saveExpert: ExpertsPanelInjected['saveExpert']
  deleteExpert: ExpertsPanelInjected['deleteExpert']
  getSkill: ExpertsPanelInjected['getSkill']
  saveSkill: ExpertsPanelInjected['saveSkill']
  deleteSkill: ExpertsPanelInjected['deleteSkill']
  importZip: ExpertsPanelInjected['importZip']
  busy: boolean
  setBusy: (v: boolean) => void
  onBack: () => void
  onOpenSkill: (expertId: string, skillName: string) => void
  onNewSkill: (expertId: string) => void
}): ReactNode {
  const { t } = props
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🧠')
  const [persona, setPersona] = useState('')
  const [skills, setSkills] = useState<readonly SkillSummary[]>([])
  const [rootPath, setRootPath] = useState('')
  const [error, setError] = useState('')
  const [id, setId] = useState(props.expertId)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (props.expertId === undefined) return
    void (async () => {
      try {
        const detail = await props.get(props.expertId!)
        setId(detail.id)
        setName(detail.name)
        setAvatar(detail.avatar)
        setPersona(detail.persona)
        setSkills(detail.skills)
        setRootPath(detail.rootPath)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error'))
      }
    })()
  }, [props.expertId, props.get, t])

  const save = async () => {
    props.setBusy(true)
    setError('')
    try {
      const detail = await props.saveExpert({
        ...id === undefined ? {} : { id },
        name,
        avatar,
        persona,
      })
      setId(detail.id)
      setSkills(detail.skills)
      setRootPath(detail.rootPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      props.setBusy(false)
    }
  }

  const remove = async () => {
    if (id === undefined) { props.onBack(); return }
    if (!window.confirm(t('confirmDelete'))) return
    props.setBusy(true)
    try {
      await props.deleteExpert(id)
      props.onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      props.setBusy(false)
    }
  }

  const onZip = async (file: File | undefined) => {
    if (file === undefined || id === undefined) return
    props.setBusy(true)
    setError('')
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      let binary = ''
      for (const byte of buffer) binary += String.fromCharCode(byte)
      const detail = await props.importZip(id, btoa(binary))
      void detail
      const next = await props.get(id)
      setSkills(next.skills)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      props.setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{id === undefined ? t('new') : t('edit')}</h1>
        <div className={styles.actions}>
          <button type="button" onClick={props.onBack} disabled={props.busy}>{t('cancel')}</button>
          <button type="button" onClick={() => void save()} disabled={props.busy}>{t('save')}</button>
          {id !== undefined && <button type="button" onClick={() => void remove()} disabled={props.busy}>{t('delete')}</button>}
        </div>
      </div>
      {error !== '' && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label htmlFor="se-avatar">{t('avatar')}</label>
        <input id="se-avatar" value={avatar} onChange={e => setAvatar(e.target.value)} maxLength={8} />
      </div>
      <div className={styles.field}>
        <label htmlFor="se-name">{t('name')}</label>
        <input id="se-name" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="se-persona">{t('persona')}</label>
        <textarea id="se-persona" value={persona} onChange={e => setPersona(e.target.value)} />
      </div>
      {rootPath !== '' && <div className={styles.path}>{rootPath}</div>}
      {id !== undefined && (
        <>
          <div className={styles.header}>
            <strong>{t('skills')}</strong>
            <div className={styles.actions}>
              <button type="button" onClick={() => props.onNewSkill(id)} disabled={props.busy}>{t('addSkill')}</button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={props.busy}>{t('importZip')}</button>
              <input ref={fileRef} type="file" accept=".zip,application/zip" hidden onChange={e => void onZip(e.target.files?.[0])} />
            </div>
          </div>
          {skills.length === 0 ? <div className={styles.muted}>{t('noSkills')}</div> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('skillName')}</th>
                  <th>{t('skillDescription')}</th>
                  <th>{t('skillNote')}</th>
                </tr>
              </thead>
              <tbody>
                {skills.map(skill => (
                  <tr key={skill.name} style={{ cursor: 'pointer' }} onClick={() => props.onOpenSkill(id, skill.name)}>
                    <td>{skill.name}</td>
                    <td>{skill.description}</td>
                    <td>{skill.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

function SkillEditor(props: {
  t: ExpertsPanelInjected['t']
  expertId: string
  skillName?: string
  getSkill: ExpertsPanelInjected['getSkill']
  saveSkill: ExpertsPanelInjected['saveSkill']
  deleteSkill: ExpertsPanelInjected['deleteSkill']
  busy: boolean
  setBusy: (v: boolean) => void
  onBack: () => void
}): ReactNode {
  const { t } = props
  const [name, setName] = useState(props.skillName ?? '')
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('')
  const [prompt, setPrompt] = useState('')
  const [absolutePath, setAbsolutePath] = useState('')
  const [extraFiles, setExtraFiles] = useState<readonly string[]>([])
  const [fromName, setFromName] = useState(props.skillName)
  const [error, setError] = useState('')

  useEffect(() => {
    if (props.skillName === undefined) return
    void (async () => {
      try {
        const detail = await props.getSkill(props.expertId, props.skillName!)
        setName(detail.name)
        setDescription(detail.description)
        setNote(detail.note)
        setPrompt(detail.prompt)
        setAbsolutePath(detail.absolutePath)
        setExtraFiles(detail.extraFiles)
        setFromName(detail.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('error'))
      }
    })()
  }, [props.expertId, props.skillName, props.getSkill, t])

  const save = async () => {
    props.setBusy(true)
    setError('')
    try {
      const detail = await props.saveSkill(props.expertId, {
        name,
        description,
        prompt,
        note,
        ...fromName === undefined || fromName === name ? {} : { fromName },
      })
      setFromName(detail.name)
      setAbsolutePath(detail.absolutePath)
      setExtraFiles(detail.extraFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      props.setBusy(false)
    }
  }

  const remove = async () => {
    if (fromName === undefined) { props.onBack(); return }
    if (!window.confirm(t('confirmDelete'))) return
    props.setBusy(true)
    try {
      await props.deleteSkill(props.expertId, fromName)
      props.onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      props.setBusy(false)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{props.skillName === undefined ? t('addSkill') : t('edit')}</h1>
        <div className={styles.actions}>
          <button type="button" onClick={props.onBack} disabled={props.busy}>{t('cancel')}</button>
          <button type="button" onClick={() => void save()} disabled={props.busy}>{t('save')}</button>
          {fromName !== undefined && <button type="button" onClick={() => void remove()} disabled={props.busy}>{t('delete')}</button>}
        </div>
      </div>
      {error !== '' && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label htmlFor="sk-name">{t('skillName')}</label>
        <input id="sk-name" value={name} onChange={e => setName(e.target.value)} placeholder="kebab-case" />
      </div>
      <div className={styles.field}>
        <label htmlFor="sk-desc">{t('skillDescription')}</label>
        <input id="sk-desc" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="sk-note">{t('skillNote')}</label>
        <input id="sk-note" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label htmlFor="sk-prompt">{t('skillPrompt')}</label>
        <textarea id="sk-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} style={{ minHeight: 180 }} />
      </div>
      {absolutePath !== '' && (
        <div className={styles.field}>
          <label>{t('skillPath')}</label>
          <div className={styles.path}>{absolutePath}</div>
        </div>
      )}
      {extraFiles.length > 0 && (
        <div className={styles.field}>
          <label>{t('skillFiles')}</label>
          <ul className={styles.files}>
            {extraFiles.map(file => <li key={file}>{file}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
