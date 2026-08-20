export type PracticeProjectId = 'sql' | 'algorithms'

export interface SqlSection {
  id: string
  subtitle: string
  theory: string
  syntax: string
  remember: string[]
  goal: string
}

export interface SqlTask {
  id: string
  section: string
  title: string
  difficulty: number
  roles: string[]
  skills: string[]
  tables: string[]
  scenario: string
  task: string
  grain: string
  checks: string[]
  hint?: string
  lesson?: string
  steps?: string[]
  starter_sql: string
  scaffold_sql?: string
  reference_sql: string
  ordered?: boolean
  kind: 'demo' | 'guided' | 'practice' | 'checkpoint'
  hint_levels?: string[]
  takeaway?: string
}

export interface SqlTableMeta {
  source: string
  label: string
  description: string
  grain: string
  primary_key: string[]
  foreign_keys: { column: string; to: string }[]
  columns: Record<string, string>
  row_count: number
}

export interface SqlCatalog {
  format: 'datapath-sql-praktikum'
  version: string
  source: string
  dataset: {
    name: string
    variant: string
    database: string
    size_bytes: number
  }
  sections: SqlSection[]
  schema: Record<string, SqlTableMeta>
  tasks: SqlTask[]
}

export interface AlgorithmTest {
  input_json: string
  output_json: string
}

export interface AlgorithmProblem {
  id: string
  slug: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  pattern: string
  interview_priority: 'core' | 'important' | 'stretch'
  why_relevant_ru?: string
  prerequisites: string[]
  statement_ru: string
  input_description_ru: string
  output_description_ru: string
  constraints_ru: string[]
  edge_cases_ru?: string[]
  function_name: string
  function_signature: string
  starter_code: string
  examples: (AlgorithmTest & { explanation_ru: string })[]
  public_tests: AlgorithmTest[]
  hidden_tests: AlgorithmTest[]
  canonical_solution: string
  explanation_ru: string
  time_complexity: string
  space_complexity: string
  common_mistakes_ru: string[]
  related_problem_slugs: string[]
  pattern_guide_slug?: string | null
  visualizer_config?: Record<string, unknown> | null
  runner_config?: Record<string, unknown>
}

export interface AlgorithmCatalog {
  format: 'datapath-algopath'
  version: string
  source: string
  problems: AlgorithmProblem[]
}

export interface PracticeTaskProgress {
  status: 'started' | 'solved'
  attempts: number
  draft: string
  help_level: number
  solution_revealed: boolean
  last_outcome: 'passed' | 'failed' | null
  updated_at: string
}

export interface SqlRunResult {
  columns: string[]
  rows: unknown[][]
  row_count: number
  truncated: boolean
  elapsed_ms: number
}

export interface SqlCheckResult extends SqlRunResult {
  correct: boolean
  message: string
  expected_columns?: string[]
  actual_columns?: string[]
  expected_rows?: number
  actual_rows?: number
}

export interface AlgorithmRunDetail {
  test_index: number
  passed: boolean
  input?: unknown
  actual?: unknown
  expected?: unknown
  error?: string
  diagnostic?: string
  elapsed_ms: number
}

export interface AlgorithmRunResult {
  verdict: string
  passed: number
  total: number
  total_time_ms: number
  error: string | null
  details: AlgorithmRunDetail[]
  stdout: string
}
