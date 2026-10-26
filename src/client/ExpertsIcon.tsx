/** Sidebar panellist icon. */

import type { ReactNode } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

/** Compact glyph for the skill-experts panel. */
export function ExpertsIcon({ size }: PropsRuntime<'sidebar.panellist'>): ReactNode {
  const s = size ?? 16
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        width: s,
        height: s,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(12, s - 2),
        lineHeight: 1,
      }}
    >
      🧠
    </span>
  )
}
