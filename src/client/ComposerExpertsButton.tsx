/** Composer tool-row control: agency-style discovery popover for skill experts. */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Input, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ExpertsKey } from './locales.ts'
import { ExpertsIcon } from './ExpertsIcon.tsx'
import { buildExpertChip, type ExpertReferenceInsert } from './composer-chip.ts'
import styles from './ComposerExperts.module.css'

export interface ComposerExpertRow {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly avatar: string
  readonly enabled: boolean
}

export interface ComposerExpertsButtonProps {
  readonly t: (key: ExpertsKey) => string
  /** Sync peek of the last successful enabled list (may be empty before warm). */
  readonly peekEnabled: () => readonly ComposerExpertRow[]
  readonly listEnabled: () => Promise<readonly ComposerExpertRow[]>
  readonly insertChip: (chip: ExpertReferenceInsert) => boolean
  readonly getContinueChat: () => Promise<boolean>
  readonly setContinueChat: (enabled: boolean) => Promise<boolean>
}

function placementFor(wrap: HTMLElement | null): 'above' | 'below' {
  if (wrap === null) return 'above'
  const rect = wrap.getBoundingClientRect()
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight
  const spaceAbove = rect.top - 12
  const spaceBelow = viewportHeight - rect.bottom - 12
  // Composer sits near the bottom; prefer above unless space below is clearly better.
  return spaceAbove >= 200 || spaceAbove >= spaceBelow ? 'above' : 'below'
}

/** Agency-style anchored discovery menu for inserting a skill-expert chip. */
export function ComposerExpertsButton(props: ComposerExpertsButtonProps): ReactNode {
  const { t } = props
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<readonly ComposerExpertRow[] | null>(() => {
    const peek = props.peekEnabled()
    return peek.length > 0 ? peek : null
  })
  const [error, setError] = useState('')
  const [placement, setPlacement] = useState<'above' | 'below'>('above')
  const [continueChat, setContinueChatState] = useState(false)
  const [continueBusy, setContinueBusy] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const genRef = useRef(0)

  const close = () => {
    genRef.current += 1
    setOpen(false)
  }

  // Warm so the first open already has rows (matches agency keeping experts while busy).
  useEffect(() => {
    let cancelled = false
    void props.listEnabled().then(list => {
      if (!cancelled) setRows(list)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [props.listEnabled])

  useEffect(() => {
    let cancelled = false
    void props.getContinueChat().then(value => {
      if (!cancelled) setContinueChatState(value)
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [props.getContinueChat])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setError('')
    const gen = ++genRef.current
    void (async () => {
      try {
        const list = await props.listEnabled()
        if (gen === genRef.current) setRows(list)
      } catch {
        if (gen === genRef.current) {
          setRows(prev => {
            if (prev !== null && prev.length > 0) return prev
            setError(t('error.generic'))
            return []
          })
        }
      }
    })()
  }, [open, props.listEnabled, t])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (wrapRef.current?.contains(target)) return
      close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const filtered = useMemo(() => {
    if (rows === null) return null
    const needle = query.trim().toLowerCase()
    if (needle === '') return rows
    return rows.filter(row => (
      `${row.name}\n${row.description}\n${row.id}`.toLowerCase().includes(needle)
    ))
  }, [rows, query])

  const pick = (row: ComposerExpertRow) => {
    const ok = props.insertChip(buildExpertChip(row))
    if (ok) close()
    else setError(t('error.generic'))
  }

  const onContinueChange = (next: boolean) => {
    if (continueBusy) return
    setContinueBusy(true)
    setContinueChatState(next)
    void props.setContinueChat(next).then(value => {
      setContinueChatState(value)
    }).catch(() => {
      setContinueChatState(!next)
      setError(t('error.generic'))
    }).finally(() => {
      setContinueBusy(false)
    })
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.cluster}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={styles.trigger}
          aria-label={t('composer.button')}
          aria-expanded={open}
          aria-haspopup="dialog"
          title={t('composer.button')}
          onClick={() => {
            if (open) {
              close()
              return
            }
            // Seed from sync cache before paint so the panel is not empty on first frame.
            const peek = props.peekEnabled()
            if (peek.length > 0) setRows(peek)
            // Place once on open — avoid post-paint flip that feels like a bounce.
            setPlacement(placementFor(wrapRef.current))
            setOpen(true)
          }}
        >
          <ExpertsIcon size={14} />
          <span>{t('composer.button')}</span>
        </Button>
        <div className={styles.continue} title={t('composer.continueHint')}>
          <Switch
            checked={continueChat}
            disabled={continueBusy}
            label={t('composer.continue')}
            title={t('composer.continueHint')}
            className={styles.continueSwitch}
            onChange={onContinueChange}
          />
          <button
            type="button"
            className={styles.continueLabel}
            disabled={continueBusy}
            tabIndex={-1}
            aria-hidden="true"
            title={t('composer.continueHint')}
            onClick={() => onContinueChange(!continueChat)}
          >
            {t('composer.continue')}
          </button>
        </div>
      </div>
      {open && (
        <div
          className={styles.menu}
          data-placement={placement}
          role="dialog"
          aria-modal="true"
          aria-label={t('composer.button')}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              close()
            }
          }}
        >
          {error !== '' && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.tools}>
            <Input
              type="search"
              autoFocus
              className={styles.searchInput}
              value={query}
              aria-label={t('composer.search')}
              placeholder={t('composer.search')}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.results} aria-busy={filtered === null}>
            {filtered === null ? (
              <p className={styles.empty} role="status">{t('panel.loading')}</p>
            ) : filtered.length === 0 ? (
              <p className={styles.empty} role="status">{t('composer.empty')}</p>
            ) : (
              <>
                <div className={styles.sectionTitle}>{t('composer.atSection')}</div>
                {filtered.map(row => (
                  <button
                    key={row.id}
                    type="button"
                    className={styles.row}
                    onClick={() => pick(row)}
                  >
                    <span className={styles.avatar} aria-hidden="true">{row.avatar}</span>
                    <span className={styles.name}>{row.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
