/** Dual-silhouette glyph for sidebar panellist and composer expert button. */

import type { ReactNode } from 'react'

/**
 * Overlapping people glyph (front + rear), same family as host `users-outline`.
 * Agency「专家」uses a sparkle / single bust; this reads as a small group.
 * @param props.size - CSS px edge length (default 16).
 */
export function ExpertsIcon(props: { readonly size?: number } = {}): ReactNode {
  const s = props.size ?? 16
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Front person */}
      <path
        d="M6 8.25C7.51878 8.25 8.75 7.01878 8.75 5.5C8.75 3.98122 7.51878 2.75 6 2.75C4.48122 2.75 3.25 3.98122 3.25 5.5C3.25 7.01878 4.48122 8.25 6 8.25Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M1 14.5C1 11.5 3.5 10.25 6 10.25C8.5 10.25 11 11.5 11 14.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Rear person (partial head + shoulder) */}
      <path
        d="M10.5 2.9C11.65 3.35 12.45 4.35 12.45 5.5C12.45 6.65 11.65 7.65 10.5 8.1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M12.4 10.6C13.9 11.3 15 12.6 15 14.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}
