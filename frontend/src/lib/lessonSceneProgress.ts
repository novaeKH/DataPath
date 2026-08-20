import type { LessonScene } from './api'

const READING_LINE_RATIO = 0.28
const VISIT_ZONE_TOP_RATIO = 0.1
const VISIT_ZONE_BOTTOM_RATIO = 0.9

export interface SceneViewportPosition {
  index: number
  top: number
  bottom: number
}

export interface SceneVisitSnapshot {
  positions: SceneViewportPosition[]
  scenes: LessonScene[]
  previousScrollY: number | null
  currentScrollY: number
  viewportHeight: number
  navigationTargetIndex: number | null
  atDocumentEnd: boolean
}

/** Checkpoints require an answer; reading/visual/lab scenes use weak visit completion. */
export function canCompleteSceneByVisit(scene: LessonScene | undefined): boolean {
  return scene != null && scene.type !== 'checkpoint'
}

function intersectsVisitZone(position: SceneViewportPosition, viewportHeight: number): boolean {
  const zoneTop = viewportHeight * VISIT_ZONE_TOP_RATIO
  const zoneBottom = viewportHeight * VISIT_ZONE_BOTTOM_RATIO
  return position.bottom >= zoneTop && position.top <= zoneBottom
}

/**
 * Returns scenes that the reading viewport actually touched.
 *
 * A continuous scroll also records section anchors crossed between animation frames, so a short
 * section is not lost during PageDown/fast scrolling. A TOC navigation target deliberately disables
 * that interpolation: jumping into the middle only visits the destination, not every earlier scene.
 */
export function collectVisitedSceneIndices(snapshot: SceneVisitSnapshot): number[] {
  const {
    positions,
    scenes,
    previousScrollY,
    currentScrollY,
    viewportHeight,
    navigationTargetIndex,
    atDocumentEnd,
  } = snapshot
  const visited = new Set<number>()
  const addIfPassive = (index: number) => {
    if (canCompleteSceneByVisit(scenes[index])) visited.add(index)
  }

  if (navigationTargetIndex != null) {
    const target = positions.find((position) => position.index === navigationTargetIndex)
    if (target && (intersectsVisitZone(target, viewportHeight) || atDocumentEnd)) {
      addIfPassive(navigationTargetIndex)
    }
    return [...visited]
  }

  for (const position of positions) {
    if (intersectsVisitZone(position, viewportHeight)) addIfPassive(position.index)
  }

  if (previousScrollY != null && previousScrollY !== currentScrollY) {
    const previousReadingLine = previousScrollY + viewportHeight * READING_LINE_RATIO
    const currentReadingLine = currentScrollY + viewportHeight * READING_LINE_RATIO
    const lower = Math.min(previousReadingLine, currentReadingLine)
    const upper = Math.max(previousReadingLine, currentReadingLine)
    for (const position of positions) {
      const documentTop = position.top + currentScrollY
      if (documentTop >= lower && documentTop <= upper) addIfPassive(position.index)
    }
  }

  if (atDocumentEnd) {
    const lastPassive = [...positions]
      .reverse()
      .find((position) => canCompleteSceneByVisit(scenes[position.index]))
    if (lastPassive) visited.add(lastPassive.index)
  }

  return [...visited].sort((left, right) => left - right)
}

export function findActiveSceneIndex(
  positions: SceneViewportPosition[],
  viewportHeight: number,
  fallbackIndex: number,
  atDocumentEnd: boolean,
): number {
  if (positions.length === 0) return fallbackIndex
  if (atDocumentEnd) return positions.at(-1)?.index ?? fallbackIndex

  const readingLine = viewportHeight * READING_LINE_RATIO
  const containing = positions.find(
    (position) => position.top <= readingLine && position.bottom > readingLine,
  )
  if (containing) return containing.index

  return positions.reduce((nearest, position) => {
    const distance =
      readingLine < position.top ? position.top - readingLine : readingLine - position.bottom
    const nearestDistance =
      readingLine < nearest.top ? nearest.top - readingLine : readingLine - nearest.bottom
    return distance < nearestDistance ? position : nearest
  }).index
}

/** Server responses are monotonic evidence; an older response must never remove local visits. */
export function mergeCompletedSceneIds(
  current: string[],
  incoming: string[],
  sceneOrder: string[],
): string[] {
  const completed = new Set([...current, ...incoming])
  const ordered = sceneOrder.filter((sceneId) => completed.has(sceneId))
  for (const sceneId of completed) {
    if (!ordered.includes(sceneId)) ordered.push(sceneId)
  }
  return ordered
}

export function completedSceneCount(
  completed: string[] | undefined,
  scenes: LessonScene[],
): number {
  const sceneIds = new Set(scenes.map((scene) => scene.id))
  return new Set((completed ?? []).filter((sceneId) => sceneIds.has(sceneId))).size
}
