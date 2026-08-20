import { loadLocalState, mutateLocalState } from '../../platform/releaseStore'
import type { PracticeProjectId, PracticeTaskProgress } from './types'

export const PRACTICE_PROGRESS_EVENT = 'datapath:practice-progress'

function projectRows(project: PracticeProjectId) {
  return loadLocalState().project_practice[project]
}

export function getPracticeProgress(project: PracticeProjectId, taskId: string) {
  return projectRows(project)[taskId]
}

export function getProjectProgress(project: PracticeProjectId) {
  return projectRows(project)
}

export function updatePracticeProgress(
  project: PracticeProjectId,
  taskId: string,
  patch: Partial<PracticeTaskProgress>,
) {
  let updated: PracticeTaskProgress | undefined
  mutateLocalState((state) => {
    const current = state.project_practice[project][taskId]
    updated = {
      status: current?.status ?? 'started',
      attempts: current?.attempts ?? 0,
      draft: current?.draft ?? '',
      help_level: current?.help_level ?? 0,
      solution_revealed: current?.solution_revealed ?? false,
      last_outcome: current?.last_outcome ?? null,
      updated_at: new Date().toISOString(),
      ...patch,
    }
    state.project_practice[project][taskId] = updated
  })
  window.dispatchEvent(new CustomEvent(PRACTICE_PROGRESS_EVENT, { detail: { project, taskId } }))
  return updated!
}

export function projectSummary(project: PracticeProjectId, taskIds: string[]) {
  const rows = projectRows(project)
  const solved = taskIds.filter((id) => rows[id]?.status === 'solved').length
  const started = taskIds.filter((id) => rows[id] && rows[id]?.status !== 'solved').length
  const recent = taskIds
    .map((id) => ({ id, updated_at: rows[id]?.updated_at ?? '' }))
    .filter((item) => item.updated_at)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0]?.id
  return { total: taskIds.length, solved, started, recent: recent ?? null }
}
