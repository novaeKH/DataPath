# DataPath Lesson System

> Phase 7 — Lesson V2 architecture. 2026-08-05.

## Learning Flow

A complete lesson supports 14 scene types in a coherent narrative:

1. Motivation — why this matters
2. Learning goals — objectives
3. Intuition — beginner-friendly explanation
4. Core mechanism — how it works
5. Formula / algorithm — mathematical form
6. Worked example — traceable calculation
7. Visual demonstration — interactive visualization
8. Python example — code + output
9. Experiment / laboratory — interactive parameter exploration
10. Checkpoint — real knowledge check
11. Common mistakes — pitfalls
12. Interview answer — concise candidate response
13. Summary — key takeaways
14. Next step — where to go

Not every lesson requires all 14 types.

## Semantic Scene Categories

| Scene type | Semantic role | What it renders |
|---|---|---|
| `markdown` | theory, motivation, objectives, summary | Rich text with headings, lists, callouts |
| `formula` | formula, mechanism | LaTeX formula block with explanation |
| `code` | code, example | Syntax-highlighted code with copy button |
| `callout` | pitfalls, important | Warning/tip/note with colored left border |
| `checkpoint` | checkpoint | Interactive question with options & feedback |
| `interactive_lab` | experiment | Parameter-driven backend computation |
| `visual` | visualization | SVG demonstration (registry-based) |
| `table` | comparison | Markdown table (auto-scrolls on mobile) |

## Checkpoint Architecture

### Backend owns
- Checkpoint ID (from vault content)
- Question text
- Answer options (parsed from markdown: `- [x] correct`, `- [ ] wrong`)
- Correct answer evaluation
- Explanation
- Completion state (via progress system)

### Frontend owns
- Rendering (radio buttons with keyboard support)
- Answer selection (click + keyboard)
- Submit interaction (prevents double-submit via ref)
- Correct/incorrect feedback with explanation
- Keeping learner's answer visible after submission
- Highlighting correct answer

### Flow
1. Show question connected to preceding theory
2. Show meaningful options (parsed from markdown)
3. Prevent submission without selection (button disabled)
4. Submit → reveal correct/incorrect
5. Show explanation from vault content
6. Keep selected answer visible; identify correct answer
7. Prevent double submission (`submittingRef`)
8. Keyboard: Enter submits when option selected

## Lesson Workspace

### Desktop (>768px)
- Left: compact outline rail (56px wide, sticky)
- Center: main reading area (780px max-width)
- Progress header: scene number + progress bar
- Navigation row: Back (outline) + Next (primary) + completion

### Mobile (<768px)
- Outline hidden or overlaid
- Content fills width
- Progress header compact
- Navigation above bottom nav
- Scene padding: 20px (vs 28px desktop)

## Visualization Registry

Visual demonstrations are registered in:
`frontend/src/components/visual-demos/VisualDemoHost.tsx`

Registry pattern:
```
visualization type → typed config → demo component → controls → explanation
```

Implemented demos (Phase 7):
- `train-val-test-split` — train/val/test proportions with group-aware toggle
- `bias-variance` — complexity slider, train/val error curves
- `tree-split-visual` — Gini impurity, split visualization

### VisualDemoFrame contract
- Clear learner goal
- Compact controls (slider, select, toggle)
- Stable visualization (no remount on param change)
- Explanation of current state
- Light/dark support
- Reduced-motion support
- Mobile-responsive container

## Laboratory Animation Stability

Rules applied to `LabFrame.tsx`:
- Component root stays mounted during parameter changes
- Keys based on param names (not values)
- No `transition: all` — specific properties only
- No entrance animation on parameter updates
- Result renderer receives current result directly (no delayed derived state)
- SVG viewBox remains stable across parameter changes
- Recharts entrance animation disabled/one-time only

## Code/Data/Chart/EDA Scenes

### CodeScene (`scene.type === 'code'`)
- Language label (only when != 'text')
- Copy button
- Internal horizontal scroll (no page overflow)
- Optional caption with markdown
- No fake Run button

### DataTableScene (future, `scene.type === 'table'`)
- Currently rendered as markdown table
- Auto-scroll container on mobile

### ChartScene (future)
- Accessible title, axes, labels
- Explanation below chart
- Consistent colors in both themes
- Responsive container

### EdaScene (future)
- Question being investigated
- Data preview
- Chosen visualization
- Observation
- Quality issue identification

## Remaining Work (Phase 8+)

- Full checkpoint evaluation backend (structured answer grading)
- Backend-generated visual demos (compute + render)
- Python code execution sandbox
- DataTable/Chart/Eda scene implementations with real data
- Full 14-scene-type coverage for all 13 lessons
- CatBoost and advanced labs when package available
