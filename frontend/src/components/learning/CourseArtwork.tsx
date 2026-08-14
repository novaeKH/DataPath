import type { CSSProperties } from 'react'
import { getCourseVisual, type CourseVisual } from './courseVisuals'

function Motif({ type }: { type: CourseVisual['motif'] }) {
  if (type === 'code') {
    return (
      <>
        <path d="M54 52 30 76l24 24M106 52l24 24-24 24" />
        <path d="m91 36-22 80" opacity=".5" />
      </>
    )
  }
  if (type === 'function') {
    return (
      <>
        <path d="M30 106C55 104 56 46 83 50s20 45 48 48" />
        <path d="M30 36v80M26 96h112" opacity=".35" />
        <circle cx="83" cy="50" r="5" fill="currentColor" stroke="none" />
      </>
    )
  }
  if (type === 'table') {
    return (
      <>
        <rect x="28" y="36" width="104" height="82" rx="10" />
        <path d="M28 62h104M62 36v82M96 36v82" opacity=".55" />
        <path d="m104 94 9-10 12 7" />
      </>
    )
  }
  if (type === 'pipeline') {
    return (
      <>
        <ellipse cx="38" cy="55" rx="19" ry="9" />
        <path d="M19 55v24c0 5 9 9 19 9s19-4 19-9V55M57 70h28" />
        <rect x="85" y="53" width="26" height="34" rx="7" />
        <path d="M111 70h28M132 63l7 7-7 7" />
      </>
    )
  }
  if (type === 'tree') {
    return (
      <>
        <circle cx="80" cy="38" r="10" />
        <circle cx="48" cy="79" r="10" />
        <circle cx="112" cy="79" r="10" />
        <circle cx="32" cy="116" r="8" />
        <circle cx="64" cy="116" r="8" />
        <circle cx="128" cy="116" r="8" />
        <path d="M74 46 52 70M86 46l22 24M45 89l-10 19M53 89l9 19M116 89l10 19" />
      </>
    )
  }
  if (type === 'network') {
    return (
      <>
        {[38, 80, 122].map((y) => (
          <circle key={`a${y}`} cx="34" cy={y} r="7" />
        ))}
        {[50, 80, 110].map((y) => (
          <circle key={`b${y}`} cx="80" cy={y} r="7" />
        ))}
        {[60, 100].map((y) => (
          <circle key={`c${y}`} cx="126" cy={y} r="8" />
        ))}
        <path
          d="M41 38 73 50M41 38l32 42M41 80l32-30M41 80h32M41 80l32 30M41 122l32-42M41 122l32-12M87 50l31 10M87 80l31-20M87 80l31 20M87 110l31-10"
          opacity=".65"
        />
      </>
    )
  }
  if (type === 'tokens') {
    return (
      <>
        <rect x="20" y="43" width="37" height="25" rx="8" />
        <rect x="65" y="43" width="28" height="25" rx="8" />
        <rect x="101" y="43" width="39" height="25" rx="8" />
        <path d="M31 91h74M31 106h98M31 121h56" opacity=".55" />
        <circle cx="120" cy="95" r="13" />
      </>
    )
  }
  if (type === 'rag') {
    return (
      <>
        <rect x="22" y="40" width="42" height="56" rx="8" />
        <rect x="96" y="40" width="42" height="56" rx="8" />
        <circle cx="80" cy="111" r="16" />
        <path d="M64 63h32M43 96l25 10M117 96l-25 10M35 55h16M35 68h16M109 55h16M109 68h16" />
      </>
    )
  }
  return (
    <>
      <rect x="20" y="56" width="34" height="34" rx="9" />
      <rect x="64" y="35" width="34" height="34" rx="9" />
      <rect x="108" y="77" width="34" height="34" rx="9" />
      <path d="M54 73h10M98 54c22 0 12 40 10 40M37 90v22h88v-1" />
      <path d="m120 104 5 7-8 4" />
    </>
  )
}

export function CourseArtwork({
  courseId,
  className = '',
  compact = false,
}: {
  courseId?: string | null
  className?: string
  compact?: boolean
}) {
  const visual = getCourseVisual(courseId)
  const style = {
    '--course-accent': visual.accent,
    '--course-tint': visual.tint,
  } as CSSProperties
  return (
    <div className={`dp-course-artwork ${compact ? 'is-compact' : ''} ${className}`} style={style}>
      <svg viewBox="0 0 160 150" fill="none" aria-hidden="true">
        <circle cx="80" cy="76" r="64" fill="currentColor" opacity=".055" stroke="none" />
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <Motif type={visual.motif} />
        </g>
      </svg>
      <span className="dp-course-artwork-orbit" aria-hidden="true" />
    </div>
  )
}

export function ProgressRing({ value, label }: { value: number; label?: string }) {
  const progress = Math.max(0, Math.min(100, value))
  return (
    <div
      className="dp-progress-ring"
      style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}
    >
      <div>
        <strong>{progress}%</strong>
        {label && <span>{label}</span>}
      </div>
    </div>
  )
}
