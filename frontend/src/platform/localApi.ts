import { runLocalSql } from './localSql'
import { runLocalLab } from './localLabs'
import { bundledAssetUrl } from './paths'
import {
  loadLocalState,
  mutateLocalState,
  replaceLocalState,
  saveLocalState,
  type LocalReleaseState,
} from './releaseStore'

interface ReleaseSnapshot {
  format: 'datapath-release-snapshot'
  schema_version: number
  app_version: string
  generated_at: string
  reads: Record<string, unknown>
  practice_runtime: Record<
    string,
    { solution: string; required: string[]; ordered: boolean; skill_id: string }
  >
  case_runtime: Record<string, LocalCaseRuntime>
}

interface LocalCaseRuntime {
  skill_ids: string[]
  practice_kind: string
  conclusion: string
  expected_problems: string[]
  questions: {
    id: string
    type: string
    options: string[]
    correct: unknown
    numeric_tolerance: number
    weight: number
    explanation: string | null
    topic: string | null
  }[]
}

let snapshotPromise: Promise<ReleaseSnapshot> | null = null

function clone<T>(value: T): T {
  return structuredClone(value)
}

function snapshot() {
  snapshotPromise ??= fetch(bundledAssetUrl('data/release-snapshot.json')).then(
    async (response) => {
      if (!response.ok) throw new Error('Offline catalogue is missing')
      const data = (await response.json()) as ReleaseSnapshot
      if (data.format !== 'datapath-release-snapshot') throw new Error('Invalid offline catalogue')
      initialiseState(data)
      return data
    },
  )
  return snapshotPromise
}

function initialiseState(data: ReleaseSnapshot) {
  const current = loadLocalState()
  if (current.initialized_from_snapshot) return
  for (const [path, value] of Object.entries(data.reads)) {
    if (!path.startsWith('/api/progress/lessons/')) continue
    const progress = value as LocalReleaseState['lesson_progress'][string]
    current.lesson_progress[progress.lesson_id] = progress
  }
  const practice = data.reads['/api/practice'] as {
    exercises?: { id: string; completed: boolean }[]
  }
  current.completed_practice =
    practice?.exercises?.filter((item) => item.completed).map((item) => item.id) ?? []
  const queue = data.reads['/api/reviews/queue?limit=30'] as {
    items?: Record<string, unknown>[]
  }
  for (const item of queue?.items ?? []) current.review_items[String(item.id)] = item
  const atlas = data.reads['/api/atlas'] as {
    nodes?: { id: string; type: string; mastery_percent?: number }[]
  }
  for (const node of atlas?.nodes ?? []) {
    if (node.type !== 'concept' || !node.mastery_percent) continue
    current.mastery[node.id] = {
      score: node.mastery_percent / 100,
      evidence_count: 1,
      updated_at: data.generated_at,
    }
  }
  current.initialized_from_snapshot = true
  saveLocalState(current)
}

export function isPackagedRuntime() {
  return (
    window.location.protocol === 'tauri:' ||
    window.location.protocol === 'capacitor:' ||
    '__TAURI_INTERNALS__' in window ||
    'Capacitor' in window
  )
}

function local404(path: string): never {
  throw new Error(`Backend вернул HTTP 404 (${path})`)
}

function roadmapWithProgress(base: Record<string, unknown>, state: LocalReleaseState) {
  const roadmap = clone(base) as {
    stages: {
      id: string
      modules: { lessons: Record<string, unknown>[] }[]
      lesson_count: number
      completed_lessons: number
      progress_percent: number
      status: string
    }[]
    total_lessons: number
    completed_lessons: number
    current_lesson: Record<string, unknown> | null
    current_stage: Record<string, unknown> | null
  }
  let current: Record<string, unknown> | null = null
  let currentStage: (typeof roadmap.stages)[number] | null = null
  for (const stage of roadmap.stages) {
    const lessons = stage.modules.flatMap((module) => module.lessons)
    for (const lesson of lessons) {
      const progress = state.lesson_progress[String(lesson.id)]
      lesson.status = progress?.completed_at ? 'completed' : progress ? 'learning' : 'available'
      if (!current && lesson.status === 'learning') {
        current = lesson
        currentStage = stage
      }
    }
    stage.lesson_count = lessons.length
    stage.completed_lessons = lessons.filter((lesson) => lesson.status === 'completed').length
    stage.progress_percent = stage.lesson_count
      ? Math.round((100 * stage.completed_lessons) / stage.lesson_count)
      : 0
    stage.status =
      stage.progress_percent === 100
        ? 'completed'
        : stage.completed_lessons
          ? 'learning'
          : 'available'
  }
  if (!current) {
    for (const stage of roadmap.stages) {
      const lesson = stage.modules
        .flatMap((module) => module.lessons)
        .find((item) => item.status !== 'completed')
      if (lesson) {
        current = lesson
        currentStage = stage
        break
      }
    }
  }
  roadmap.total_lessons = roadmap.stages.reduce((sum, stage) => sum + stage.lesson_count, 0)
  roadmap.completed_lessons = roadmap.stages.reduce(
    (sum, stage) => sum + stage.completed_lessons,
    0,
  )
  roadmap.current_lesson = current
  roadmap.current_stage = currentStage
    ? {
        id: currentStage.id,
        number: roadmap.stages.indexOf(currentStage) + 1,
        title: (currentStage as unknown as { title: string }).title,
        depth: (currentStage as unknown as { depth: string }).depth,
        progress_percent: currentStage.progress_percent,
      }
    : null
  return roadmap
}

function recordMastery(
  state: LocalReleaseState,
  skillId: string | undefined,
  success: number,
  weight = 0.18,
) {
  if (!skillId) return
  const current = state.mastery[skillId] ?? { score: 0, evidence_count: 0, updated_at: '' }
  const score = Math.max(0, Math.min(1, current.score + (success - current.score) * weight))
  state.mastery[skillId] = {
    score: Math.round(score * 1000) / 1000,
    evidence_count: current.evidence_count + 1,
    updated_at: new Date().toISOString(),
  }
}

function scheduleSelfAssessmentReview(
  state: LocalReleaseState,
  lesson: {
    id?: string
    title: string
    skills: string[]
    scenes: { id: string; question?: string }[]
  },
  sceneId: string,
  outcome: string,
) {
  const interval = { self_confident: 4, self_review: 1, self_uncertain: 0.25 }[outcome]
  if (interval === undefined) return
  const template = `${lesson.id ?? 'lesson'}:${sceneId}:self`
  const id = String(Number.parseInt(checksum(template), 16))
  const scene = lesson.scenes.find((item) => item.id === sceneId)
  const dueAt = new Date(Date.now() + interval * 86_400_000).toISOString()
  const current = state.review_items[id]
  state.review_items[id] = {
    ...(current ?? {}),
    id: Number(id),
    template_id: template,
    title: lesson.title,
    prompt: scene?.question ?? 'Вспомните ключевую идею урока.',
    question_type: 'reveal_and_rate',
    options: [],
    source_content_id: lesson.id,
    source_lesson_id: lesson.id,
    source_type: 'lesson',
    source_id: lesson.id,
    primary_skill_id: lesson.skills[0] ?? 'general',
    difficulty: 'core',
    objective: false,
    stage: outcome === 'self_uncertain' ? 'relearning' : 'learning',
    status: 'active',
    due_at:
      current && Date.parse(String(current.due_at)) < Date.parse(dueAt) ? current.due_at : dueAt,
    interval_days: interval,
    ease_factor: 2.5,
    repetitions: Number(current?.repetitions ?? 0),
    lapses: Number(current?.lapses ?? 0),
  }
}

function reviewQueue(state: LocalReleaseState, path: string) {
  const search = new URL(path, 'https://local.datapath').searchParams
  const limit = Math.min(Number(search.get('limit') ?? 10), 30)
  const lessonId = search.get('lesson_id')
  const skillId = search.get('skill_id')
  const now = Date.now()
  const all = Object.values(state.review_items)
    .filter((item) => !lessonId || item.source_lesson_id === lessonId)
    .filter((item) => !skillId || item.primary_skill_id === skillId)
    .sort((left, right) => String(left.due_at).localeCompare(String(right.due_at)))
  const due = all.filter((item) => Date.parse(String(item.due_at)) <= now)
  return {
    items: due.slice(0, limit),
    returned: Math.min(due.length, limit),
    due_count: due.length,
    overdue_count: due.filter((item) => Date.parse(String(item.due_at)) < now - 86_400_000).length,
    next_due_at: all[0]?.due_at ?? null,
    limit,
  }
}

function reviewSummary(state: LocalReleaseState, path: string) {
  const queue = reviewQueue(state, path.replace('/summary', '/queue'))
  const today = new Date().toISOString().slice(0, 10)
  return {
    due_count: queue.due_count,
    overdue_count: queue.overdue_count,
    completed_today: state.review_history.filter((row) =>
      String(row.created_at ?? '').startsWith(today),
    ).length,
    next_due_at: queue.next_due_at,
    active_items: Object.keys(state.review_items).length,
    stages: { learning: queue.due_count, review: 0, relearning: 0 },
    recommendation: queue.due_count
      ? `На сегодня запланировано повторений: ${queue.due_count}.`
      : 'На сегодня повторений нет.',
  }
}

function practiceCatalog(base: unknown, state: LocalReleaseState) {
  const catalog = clone(base) as {
    exercises: { id: string; completed: boolean }[]
    completed_count: number
    total_count: number
  }
  const completed = new Set(state.completed_practice)
  for (const exercise of catalog.exercises) exercise.completed = completed.has(exercise.id)
  catalog.completed_count = catalog.exercises.filter((exercise) => exercise.completed).length
  return catalog
}

function todayPayload(data: ReleaseSnapshot, state: LocalReleaseState) {
  const base = clone(data.reads['/api/today']) as Record<string, unknown>
  const roadmap = roadmapWithProgress(data.reads['/api/roadmap'] as Record<string, unknown>, state)
  const progressRows = Object.values(state.lesson_progress)
  const active = progressRows
    .filter((item) => !item.completed_at)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0]
  const lessons = data.reads as Record<string, unknown>
  const detail = active
    ? (lessons[`/api/content/lessons/${active.lesson_id}`] as {
        title?: string
        estimated_minutes?: number
      })
    : null
  base.continue_lesson = active
    ? {
        ...active,
        title: detail?.title ?? active.lesson_id,
        estimated_minutes: detail?.estimated_minutes,
      }
    : null
  const nextLesson = roadmap.current_lesson
  const nextLessonId = String((nextLesson as { id?: string } | null)?.id ?? '')
  const nextLessonDetail = nextLessonId
    ? (data.reads[`/api/content/lessons/${nextLessonId}`] as
        { skills?: unknown; estimated_minutes?: number } | undefined)
    : undefined
  base.next_lesson = nextLesson
    ? {
        ...nextLesson,
        skills: Array.isArray(nextLesson.skills)
          ? nextLesson.skills
          : Array.isArray(nextLessonDetail?.skills)
            ? nextLessonDetail.skills
            : [],
        estimated_minutes:
          nextLesson.estimated_minutes ?? nextLessonDetail?.estimated_minutes ?? null,
      }
    : null
  base.roadmap_context = {
    current_stage: roadmap.current_stage,
    current_lesson: roadmap.current_lesson,
    completed_lessons: roadmap.completed_lessons,
    total_lessons: roadmap.total_lessons,
  }
  const reviews = reviewSummary(state, '/api/reviews/summary')
  base.review_summary = reviews
  base.due_reviews = reviews.due_count
  base.overdue_reviews = reviews.overdue_count
  const practice = practiceCatalog(data.reads['/api/practice'], state)
  const suggested = practice.exercises.find((item) => !item.completed && item.id !== undefined)
  if (suggested) {
    base.suggested_practice = {
      exercise_id: suggested.id,
      title: (suggested as unknown as { title: string }).title,
      track: (suggested as unknown as { track: string }).track,
      estimated_minutes: (suggested as unknown as { estimated_minutes: number }).estimated_minutes,
    }
  }
  return base
}

function checksum(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function backup(state: LocalReleaseState) {
  const rows = [{ state }]
  return {
    format: 'datapath-learning-state',
    version: 1,
    exported_at: new Date().toISOString(),
    checksum: checksum(JSON.stringify(rows)),
    tables: { local_state: rows },
  }
}

export async function localRead<T>(path: string): Promise<T> {
  const data = await snapshot()
  const state = loadLocalState()
  if (path === '/api/system/backup') return backup(state) as T
  if (path === '/api/system/status') {
    return {
      status: 'ok',
      version: data.app_version,
      environment: 'local-first',
      database: { available: true },
      vault: {
        exists: true,
        markdown_files: (data.reads['/api/system/status'] as { vault: { markdown_files: number } })
          .vault.markdown_files,
      },
      ollama: 'not_configured',
      chromadb: 'not_configured',
    } as T
  }
  if (path === '/api/roadmap') {
    const roadmap = roadmapWithProgress(data.reads[path] as Record<string, unknown>, state)
    const currentId = String((roadmap.current_lesson as { id?: string } | null)?.id ?? '')
    if (currentId && state.current_roadmap_position !== currentId) {
      mutateLocalState((current) => {
        current.current_roadmap_position = currentId
      })
    }
    return roadmap as T
  }
  if (path === '/api/atlas') {
    const atlas = clone(data.reads[path]) as { nodes: Record<string, unknown>[] }
    for (const node of atlas.nodes) {
      if (node.type === 'lesson') {
        const progress = state.lesson_progress[String(node.id)]
        if (progress?.completed_at) node.status = 'strong'
        else if (progress) node.status = 'exploring'
      } else if (node.type === 'concept') {
        const mastery = state.mastery[String(node.id)]
        if (mastery) {
          node.mastery_percent = Math.round(mastery.score * 100)
          node.status =
            mastery.score >= 0.8 ? 'strong' : mastery.score >= 0.4 ? 'developing' : 'exploring'
        }
      } else if (node.type === 'practice' && state.completed_practice.includes(String(node.id))) {
        node.status = 'strong'
        node.mastery_percent = Math.max(Number(node.mastery_percent ?? 0), 70)
      }
      const dueCount = Object.values(state.review_items).filter(
        (item) =>
          item.source_lesson_id === node.id && Date.parse(String(item.due_at)) <= Date.now(),
      ).length
      if (dueCount) {
        node.review_due = true
        node.review_due_count = dueCount
      }
    }
    return atlas as T
  }
  if (path === '/api/today') {
    const payload = todayPayload(data, state)
    mutateLocalState((current) => {
      current.today_state = {
        date: new Date().toISOString().slice(0, 10),
        opened_at: new Date().toISOString(),
        lesson_id: (payload.continue_lesson as { lesson_id?: string } | null)?.lesson_id ?? null,
      }
    })
    return payload as T
  }
  if (path === '/api/practice') return practiceCatalog(data.reads[path], state) as T
  if (path.startsWith('/api/progress/lessons/')) {
    const lessonId = decodeURIComponent(path.split('/').at(-1) ?? '')
    const progress = state.lesson_progress[lessonId]
    if (!progress) local404(path)
    return clone(progress) as T
  }
  if (path.startsWith('/api/reviews/queue')) return reviewQueue(state, path) as T
  if (path.startsWith('/api/reviews/summary')) return reviewSummary(state, path) as T
  if (path.startsWith('/api/reviews/history')) {
    return { attempts: state.review_history, count: state.review_history.length } as T
  }
  const reviewMatch = path.match(/^\/api\/reviews\/(\d+)$/)
  if (reviewMatch) {
    const item = state.review_items[reviewMatch[1]]
    if (!item) local404(path)
    return clone(item) as T
  }
  const attemptsMatch = path.match(/^\/api\/cases\/([^/]+)\/attempts$/)
  if (attemptsMatch) {
    const id = decodeURIComponent(attemptsMatch[1])
    return { case_id: id, attempts: state.case_attempts[id] ?? [] } as T
  }
  const labMatch = path.match(/^\/api\/labs\/([^/]+)$/)
  if (labMatch) {
    const stored = data.reads[path]
    if (stored === undefined) local404(path)
    const spec = clone(stored) as { description?: string }
    if (spec.description) {
      spec.description = spec.description
        .replace('Backend считает', 'Локальный движок PWA считает')
        .replace('backend обучает', 'локальный движок PWA обучает')
    }
    return spec as T
  }
  const exact = data.reads[path]
  if (exact !== undefined) return clone(exact) as T
  if (path.startsWith('/api/cases/') && path.includes('?mode=')) {
    const standardPath = path.replace(/mode=(guided|interview)/, 'mode=standard')
    const value = data.reads[standardPath]
    if (value !== undefined)
      return {
        ...(clone(value) as object),
        mode: new URL(path, 'https://local').searchParams.get('mode'),
      } as T
  }
  local404(path)
}

function addPracticeEvidence(
  state: LocalReleaseState,
  exerciseId: string,
  passed: boolean,
  skillId?: string,
) {
  if (passed && !state.completed_practice.includes(exerciseId)) {
    state.completed_practice.push(exerciseId)
  }
  state.practice_history.unshift({
    exercise_id: exerciseId,
    passed,
    created_at: new Date().toISOString(),
  })
  if (state.practice_history.length > 500) state.practice_history.length = 500
  recordMastery(state, skillId, passed ? 0.85 : 0.25, 0.22)
  return [
    {
      skill_id: skillId ?? exerciseId,
      state: passed ? 'developing' : 'exploring',
      evidence_count: 1,
    },
  ]
}

function displayCorrect(question: LocalCaseRuntime['questions'][number]) {
  if (question.type === 'single' || question.type === 'select') {
    return question.options[Number(question.correct)] ?? String(question.correct)
  }
  if (Array.isArray(question.correct)) {
    return question.correct
      .map((index) => question.options[Number(index)] ?? String(index))
      .join(' → ')
  }
  return String(question.correct)
}

function evaluateCase(
  runtime: LocalCaseRuntime,
  answers: Record<string, unknown>,
  caseId: string,
  mode: string,
) {
  let weighted = 0
  let totalWeight = 0
  const questionResults = runtime.questions.map((question) => {
    const answer = answers[question.id]
    let score = 0
    if (question.type === 'multiple') {
      const selected = Array.isArray(answer) ? [...answer].sort() : []
      const expected = Array.isArray(question.correct) ? [...question.correct].sort() : []
      score = JSON.stringify(selected) === JSON.stringify(expected) ? 1 : 0
    } else if (question.type === 'order') {
      score = JSON.stringify(answer) === JSON.stringify(question.correct) ? 1 : 0
    } else if (question.type === 'numeric') {
      score =
        Math.abs(Number(answer) - Number(question.correct)) <= question.numeric_tolerance ? 1 : 0
    } else {
      score = answer === question.correct ? 1 : 0
    }
    totalWeight += question.weight
    weighted += score * question.weight
    return {
      question_id: question.id,
      topic: question.topic,
      type: question.type,
      score,
      correct: score === 1,
      explanation:
        question.explanation ?? (score === 1 ? 'Верно.' : `Разбор: ${displayCorrect(question)}.`),
      your_answer: answer,
    }
  })
  const total = totalWeight ? Math.round((1000 * weighted) / totalWeight) / 1000 : 0
  return {
    case_id: caseId,
    mode,
    total_score: total,
    passed: total >= 0.7,
    question_results: questionResults,
    error_codes: [],
    summary:
      total >= 0.7
        ? `Кейс выполнен: ${Math.round(total * 100)}%.`
        : `Результат ${Math.round(total * 100)}%. Разберите объяснения и повторите попытку.`,
    conclusion: runtime.conclusion,
    expected_problems: runtime.expected_problems,
  }
}

export async function localPost<T>(path: string, body: unknown): Promise<T> {
  const data = await snapshot()
  const labRunMatch = path.match(/^\/api\/labs\/([^/]+)\/run$/)
  if (labRunMatch) {
    const labId = decodeURIComponent(labRunMatch[1])
    const spec = data.reads[`/api/labs/${labId}`] as
      { initial_result?: Record<string, unknown> } | undefined
    if (!spec?.initial_result) local404(path)
    const payload = body as { parameters?: Record<string, string | number> }
    return runLocalLab(labId, payload.parameters ?? {}, spec.initial_result) as T
  }
  const sceneMatch = path.match(/^\/api\/progress\/lessons\/([^/]+)\/scenes\/([^/]+)\/complete$/)
  if (sceneMatch) {
    const lessonId = decodeURIComponent(sceneMatch[1])
    const sceneId = decodeURIComponent(sceneMatch[2])
    const now = new Date().toISOString()
    const payload = body as { outcome?: string }
    const saved = mutateLocalState((state) => {
      const current = state.lesson_progress[lessonId] ?? {
        lesson_id: lessonId,
        current_scene_id: sceneId,
        completed_scenes: [],
        started_at: now,
        completed_at: null,
        updated_at: now,
      }
      current.current_scene_id = sceneId
      current.updated_at = now
      if (!current.completed_scenes.includes(sceneId)) current.completed_scenes.push(sceneId)
      state.lesson_progress[lessonId] = current
      state.current_roadmap_position = lessonId
      const lesson = data.reads[`/api/content/lessons/${lessonId}`] as {
        id?: string
        title: string
        skills: string[]
        scenes: { id: string; question?: string }[]
      }
      scheduleSelfAssessmentReview(state, lesson, sceneId, payload.outcome ?? 'completed')
      const attemptKey = `${lessonId}:${sceneId}`
      const outcome = payload.outcome ?? 'completed'
      if (!state.assessment_attempts[attemptKey]) {
        const success = {
          correct: 1,
          incorrect: 0,
          self_confident: 0.7,
          self_review: 0.45,
          self_uncertain: 0.25,
          reflection: 0.5,
        }[outcome]
        if (success !== undefined) recordMastery(state, lesson.skills[0], success, 0.08)
      }
      if (outcome !== 'completed') {
        state.assessment_attempts[attemptKey] = { outcome, created_at: now }
      }
    })
    return { ...saved.lesson_progress[lessonId], scene_id: sceneId, event_id: Date.now() } as T
  }
  const lessonMatch = path.match(/^\/api\/progress\/lessons\/([^/]+)\/complete$/)
  if (lessonMatch) {
    const lessonId = decodeURIComponent(lessonMatch[1])
    const now = new Date().toISOString()
    mutateLocalState((state) => {
      const lesson = data.reads[`/api/content/lessons/${lessonId}`] as {
        title: string
        scenes: { id: string; type: string; question?: string; assessment_type?: string }[]
        skills: string[]
      }
      const progress = state.lesson_progress[lessonId] ?? {
        lesson_id: lessonId,
        current_scene_id: null,
        completed_scenes: [],
        started_at: now,
        completed_at: null,
        updated_at: now,
      }
      progress.completed_at = now
      progress.updated_at = now
      progress.current_scene_id = lesson.scenes.at(-1)?.id ?? null
      progress.completed_scenes = lesson.scenes.map((scene) => scene.id)
      state.lesson_progress[lessonId] = progress
      state.current_roadmap_position = lessonId
      for (const skillId of lesson.skills) recordMastery(state, skillId, 0.8, 0.2)
      lesson.scenes
        .filter((scene) => scene.type === 'checkpoint')
        .slice(0, 3)
        .forEach((scene, index) => {
          const id = String(Date.now() + index)
          state.review_items[id] = {
            id: Number(id),
            template_id: `${lessonId}:${scene.id}`,
            title: lesson.title,
            prompt: scene.question ?? 'Вспомните ключевую идею урока.',
            question_type: 'reveal_and_rate',
            options: [],
            source_content_id: lessonId,
            source_lesson_id: lessonId,
            source_type: 'lesson',
            source_id: lessonId,
            primary_skill_id: lesson.skills[0] ?? 'general',
            difficulty: 'core',
            objective: false,
            stage: 'learning',
            status: 'active',
            due_at: new Date(Date.now() + 86_400_000).toISOString(),
            interval_days: 1,
            ease_factor: 2.5,
            repetitions: 0,
            lapses: 0,
          }
        })
    })
    return { lesson_id: lessonId, completed_at: now, skills: [] } as T
  }
  if (path === '/api/practice/code/check') {
    const payload = body as { exercise_id: string; code: string }
    const runtime = data.practice_runtime[payload.exercise_id]
    if (!runtime) local404(path)
    const normalized = payload.code.replace(/\s+/g, '').toLowerCase().replaceAll("'", '"')
    const missing = runtime.required.filter(
      (fragment) =>
        !normalized.includes(fragment.replace(/\s+/g, '').toLowerCase().replaceAll("'", '"')),
    )
    let evidence: unknown[] = []
    mutateLocalState((state) => {
      evidence = addPracticeEvidence(
        state,
        payload.exercise_id,
        missing.length === 0,
        runtime.skill_id,
      )
    })
    return {
      passed: missing.length === 0,
      feedback:
        missing.length === 0
          ? 'Ключевые шаги решения найдены.'
          : 'Не все обязательные шаги найдены.',
      missing_count: missing.length,
      solution: runtime.solution,
      evidence,
    } as T
  }
  if (path === '/api/practice/sql/run') {
    const payload = body as { exercise_id: string; query: string }
    const runtime = data.practice_runtime[payload.exercise_id]
    if (!runtime) local404(path)
    const result = await runLocalSql(payload.query, runtime.solution, runtime.ordered)
    let evidence: unknown[] = []
    mutateLocalState((state) => {
      evidence = addPracticeEvidence(state, payload.exercise_id, result.passed, runtime.skill_id)
    })
    return { ...result, evidence } as T
  }
  const caseMatch = path.match(/^\/api\/cases\/([^/]+)\/submit$/)
  if (caseMatch) {
    const caseId = decodeURIComponent(caseMatch[1])
    const payload = body as { mode: string; answers: Record<string, unknown> }
    const runtime = data.case_runtime[caseId]
    if (!runtime) local404(path)
    const evaluated = evaluateCase(runtime, payload.answers, caseId, payload.mode)
    const now = new Date().toISOString()
    const attemptId = Date.now()
    mutateLocalState((state) => {
      const attempts = (state.case_attempts[caseId] ??= [])
      attempts.unshift({
        id: attemptId,
        case_id: caseId,
        mode: payload.mode,
        answers: payload.answers,
        result: evaluated,
        completed_at: now,
      })
      for (const skillId of runtime.skill_ids) {
        recordMastery(state, skillId, evaluated.total_score, 0.25)
      }
    })
    return { ...evaluated, attempt_id: attemptId, evidence: [] } as T
  }
  const reviewSubmit = path.match(/^\/api\/reviews\/(\d+)\/submit$/)
  if (reviewSubmit) {
    const id = reviewSubmit[1]
    const payload = body as { user_rating: string }
    let response: Record<string, unknown> | null = null
    mutateLocalState((state) => {
      const item = state.review_items[id]
      if (!item) local404(path)
      const days = { Again: 1, Hard: 2, Good: 4, Easy: 7 }[payload.user_rating] ?? 2
      item.due_at = new Date(Date.now() + days * 86_400_000).toISOString()
      item.interval_days = days
      item.repetitions = Number(item.repetitions ?? 0) + 1
      const attempt = {
        id: Date.now(),
        review_item_id: Number(id),
        template_id: item.template_id,
        title: item.title,
        objective_score: null,
        is_correct: null,
        user_rating: payload.user_rating,
        effective_rating: payload.user_rating,
        hints_used: 0,
        deduplicated: false,
        created_at: new Date().toISOString(),
      }
      state.review_history.unshift(attempt)
      recordMastery(
        state,
        String(item.primary_skill_id ?? ''),
        { Again: 0.2, Hard: 0.45, Good: 0.8, Easy: 0.95 }[payload.user_rating] ?? 0.45,
        0.2,
      )
      response = {
        review_item_id: Number(id),
        template_id: item.template_id,
        title: item.title,
        objective_score: null,
        is_correct: null,
        user_rating: payload.user_rating,
        effective_rating: payload.user_rating,
        explanation: 'Самооценка сохранена. Следующий интервал обновлён.',
        correct_answer: null,
        interval_days: days,
        ease_factor: item.ease_factor,
        stage: item.stage,
        next_due_at: item.due_at,
        repetitions: item.repetitions,
        lapses: item.lapses,
        knowledge_impact: [],
        skill_state: null,
        skill_axes: {},
        attempt_id: attempt.id,
        deduplicated: false,
      }
    })
    return response as T
  }
  const reviewSkip = path.match(/^\/api\/reviews\/(\d+)\/skip$/)
  if (reviewSkip) {
    const dueAt = new Date(Date.now() + 86_400_000).toISOString()
    mutateLocalState((state) => {
      const item = state.review_items[reviewSkip[1]]
      if (!item) local404(path)
      item.due_at = dueAt
    })
    return { skipped: true, due_at: dueAt } as T
  }
  if (path === '/api/system/restore') {
    const payload = body as {
      format?: string
      version?: number
      checksum?: string
      tables?: { local_state?: { state?: unknown }[] }
    }
    if (payload.format !== 'datapath-learning-state' || payload.version !== 1) {
      throw new Error('Формат backup не поддерживается этой версией DataPath.')
    }
    const rows = payload.tables?.local_state
    if (!rows || checksum(JSON.stringify(rows)) !== payload.checksum) {
      throw new Error('Checksum backup не совпадает: файл повреждён или изменён.')
    }
    const restored = rows[0]?.state
    if (!restored) throw new Error('Backup не содержит local_state.')
    replaceLocalState(restored)
    return { status: 'restored', rows: { local_state: 1 } } as T
  }
  if (path.startsWith('/api/progress/labs/')) {
    return {
      score: 1,
      evidence: [],
      created_at: new Date().toISOString(),
      deduplicated: false,
    } as T
  }
  local404(path)
}
