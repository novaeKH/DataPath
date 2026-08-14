export type CourseVisual = {
  shortTitle: string
  description: string
  accent: string
  tint: string
  motif: 'code' | 'function' | 'table' | 'pipeline' | 'tree' | 'network' | 'tokens' | 'rag' | 'ops'
}

export const COURSE_VISUALS: Record<string, CourseVisual> = {
  'course.python-ds': {
    shortTitle: 'Python',
    description: 'Язык, структуры данных и алгоритмическое мышление',
    accent: '#6366f1',
    tint: '#eef2ff',
    motif: 'code',
  },
  'course.math-ds': {
    shortTitle: 'Математика',
    description: 'Линейная алгебра, анализ, вероятность и статистика',
    accent: '#8b5cf6',
    tint: '#f3e8ff',
    motif: 'function',
  },
  'course.data-analysis': {
    shortTitle: 'NumPy & pandas',
    description: 'Массивы, таблицы и практический анализ данных',
    accent: '#0ea5e9',
    tint: '#e0f2fe',
    motif: 'table',
  },
  'course.data-tools': {
    shortTitle: 'SQL & scikit-learn',
    description: 'Запросы, подготовка данных и воспроизводимые пайплайны',
    accent: '#06b6d4',
    tint: '#cffafe',
    motif: 'pipeline',
  },
  'course.classic-ml': {
    shortTitle: 'Classic ML',
    description: 'Модели, метрики, валидация и интерпретация',
    accent: '#4f46e5',
    tint: '#e0e7ff',
    motif: 'tree',
  },
  'course.deep-learning': {
    shortTitle: 'Deep Learning',
    description: 'Нейронные сети, обучение и современные архитектуры',
    accent: '#ec4899',
    tint: '#fce7f3',
    motif: 'network',
  },
  'course.nlp': {
    shortTitle: 'NLP',
    description: 'Представление текста, классификация и Transformers',
    accent: '#f97316',
    tint: '#ffedd5',
    motif: 'tokens',
  },
  'course.llm-rag': {
    shortTitle: 'LLM / RAG',
    description: 'Поиск, генерация, оценка и надёжные LLM-системы',
    accent: '#7c3aed',
    tint: '#ede9fe',
    motif: 'rag',
  },
  'course.mlops': {
    shortTitle: 'MLOps',
    description: 'Эксперименты, сервисы, мониторинг и жизненный цикл',
    accent: '#14b8a6',
    tint: '#ccfbf1',
    motif: 'ops',
  },
}

const FALLBACK_VISUAL = COURSE_VISUALS['course.classic-ml']

export function getCourseVisual(courseId?: string | null): CourseVisual {
  return (courseId && COURSE_VISUALS[courseId]) || FALLBACK_VISUAL
}

export function courseIdFromLessonId(lessonId?: string | null): string {
  if (!lessonId) return 'course.classic-ml'
  const prefix = Object.keys(COURSE_VISUALS).find((courseId) =>
    lessonId.startsWith(`lesson.${courseId.replace('course.', '')}.`),
  )
  return prefix ?? 'course.classic-ml'
}
