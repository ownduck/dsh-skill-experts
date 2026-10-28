/** Controlled Markdown editor for long prompt fields (persona / skill body). */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import styles from './ExpertsPanel.module.css'
import './markdown-field.css'

/** Default toolbar without the external help / docs link. */
function withoutHelp(list: ReturnType<typeof commands.getCommands>) {
  return list.filter(cmd => cmd.name !== 'help' && cmd.keyCommand !== 'help')
}

const TOOLBAR_COMMANDS = withoutHelp(commands.getCommands())

const DEFAULT_HEIGHT = 220
const MIN_HEIGHT = 160
const MAX_HEIGHT = 640

export interface MarkdownFieldProps {
  readonly id: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly 'aria-label'?: string
  readonly disabled?: boolean
  readonly height?: number
  readonly placeholder?: string
}

type ColorMode = 'light' | 'dark'

/** Prefer the host document color-scheme (DSH theme), not OS prefers-color-scheme alone. */
function readColorMode(): ColorMode {
  if (typeof document === 'undefined') return 'light'
  const scheme = getComputedStyle(document.documentElement).colorScheme.trim()
  if (scheme === 'dark' || scheme === 'light') return scheme
  const root = document.documentElement
  const attr = root.getAttribute('data-color-mode')
    ?? root.getAttribute('data-theme')
    ?? root.dataset.theme
  if (attr === 'dark' || attr === 'light') return attr
  const classList = root.classList
  if (classList.contains('dark') || classList.contains('theme-dark')) return 'dark'
  if (classList.contains('light') || classList.contains('theme-light')) return 'light'
  return 'light'
}

function parseHeight(value: CSSProperties['height'] | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const matched = /^(\d+(?:\.\d+)?)px$/u.exec(value.trim())
    if (matched !== null) return Number(matched[1])
  }
  return fallback
}

/**
 * Markdown source editor (edit-first) with optional preview, themed for the host shell.
 * @param props - controlled field props.
 */
export function MarkdownField(props: MarkdownFieldProps): ReactNode {
  const initialHeight = props.height ?? DEFAULT_HEIGHT
  const [colorMode, setColorMode] = useState<ColorMode>(readColorMode)
  const [height, setHeight] = useState(initialHeight)

  useEffect(() => {
    setHeight(props.height ?? DEFAULT_HEIGHT)
  }, [props.height])

  useEffect(() => {
    const sync = () => setColorMode(readColorMode())
    sync()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', sync)
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme', 'data-color-mode'],
    })
    return () => {
      media.removeEventListener('change', sync)
      observer.disconnect()
    }
  }, [])

  return (
    <div
      className={styles.markdownField}
      data-skill-experts-md=""
      data-color-mode={colorMode}
      id={props.id}
      style={{ minHeight: height }}
    >
      <MDEditor
        value={props.value}
        height={height}
        minHeight={MIN_HEIGHT}
        maxHeight={MAX_HEIGHT}
        preview="edit"
        visibleDragbar={!props.disabled}
        overflow={false}
        commands={TOOLBAR_COMMANDS}
        commandsFilter={cmd => (cmd.name === 'help' || cmd.keyCommand === 'help' ? false : cmd)}
        textareaProps={{
          id: `${props.id}-textarea`,
          'aria-label': props['aria-label'],
          disabled: props.disabled,
          placeholder: props.placeholder,
        }}
        onHeightChange={next => {
          setHeight(parseHeight(next, height))
        }}
        onChange={next => {
          if (props.disabled) return
          props.onChange(next ?? '')
        }}
      />
    </div>
  )
}
