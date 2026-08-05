# DataPath UI System

> Версия: Phase 7 (product redesign). Дата: 2026-08-05.

## Design direction: "Quiet Spatial Learning"

Calm neutral backgrounds, restrained emerald accent, generous whitespace,
strong typography, subtle depth, clear interactive states, minimal decorative
noise. No glassmorphism, no neon gradients, no heavy shadows.

## Semantic Design Tokens

All visual properties use CSS custom properties (design tokens) defined in
`frontend/src/index.css`. These tokens have different light/dark values — the
semantic names stay the same.

### Surface hierarchy (3 levels)

| Token | Role |
|---|---|
| `--dp-app-bg` | Application background |
| `--dp-surface` | Secondary surface: cards, panels, nav |
| `--dp-surface-elevated` | Elevated surface (shadow + border) |
| `--dp-surface-interactive` | Interactive hover/active surface |

### Shared component classes

| CSS class | Purpose |
|---|---|
| `.dp-surface` | Standard card surface |
| `.dp-surface-elevated` | Elevated card with shadow |
| `.dp-hover-interactive` | Hover background transition |
| `.dp-page-title` | h1 page/course/lesson title |
| `.dp-page-subtitle` | Descriptive subtitle below title |
| `.dp-section-title` | Uppercase section label |
| `.dp-content` | Markdown-rich content container |
| `.dp-reading` | Max-width reading column (780px) |
| `.dp-scene` | Scene-level spacing (28px top/bottom) |
| `.dp-formula-block` | Formula display block |
| `.dp-code-block` | Code display block |
| `.dp-divider` | Subtle horizontal divider |

### Interaction states

Every shared interactive component specifies:
- default
- hover
- active
- selected
- focus-visible
- disabled

Dark-theme hover bug fixed: text-on-hover uses explicit `dark:` variants,
not inverted light-theme classes. All button variants have complete
light+dark state chains.

### Typography

- Body: 16px / 1.65 line-height
- Page titles: 1.5rem / 700 weight
- Section titles: 0.8125rem / 600 / uppercase
- Reading width: 780px max
- Body font: Inter (system-ui fallback)
- Code font: JetBrains Mono (monospace fallback)

### Theme

- Theme toggle in sidebar (desktop) / top bar (mobile)
- `theme-transition` class enables smooth 0.2s transitions
- `prefers-reduced-motion` respected globally
- Scrollbars: thin, semi-transparent semantic color

### Mobile

- Top bar (logo + theme toggle) + bottom nav (5 sections)
- Desktop sidebar hidden below `md:` breakpoint
- Tighter padding (20px scenes vs 28px desktop)
- Code blocks and tables: internal horizontal scroll (no page overflow)
- Checkpoint touch targets: min 44px
- Bottom safe-area inset respected via `.pb-safe`
