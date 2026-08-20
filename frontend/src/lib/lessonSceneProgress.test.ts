import { describe, expect, it } from 'vitest'
import type { LessonScene } from './api'
import {
  collectVisitedSceneIndices,
  completedSceneCount,
  findActiveSceneIndex,
  mergeCompletedSceneIds,
} from './lessonSceneProgress'

function scene(id: string, type: LessonScene['type'] = 'markdown'): LessonScene {
  return { id, type, title: id }
}

const scenes = [
  scene('scene-01'),
  scene('scene-02', 'formula'),
  scene('scene-03', 'code'),
  scene('scene-04', 'visual_demo'),
  scene('scene-05', 'checkpoint'),
]

describe('lesson scene visit tracking', () => {
  it('records a section when slow scrolling brings it into the reading viewport', () => {
    expect(
      collectVisitedSceneIndices({
        scenes,
        positions: [{ index: 1, top: 120, bottom: 420 }],
        previousScrollY: 500,
        currentScrollY: 520,
        viewportHeight: 800,
        navigationTargetIndex: null,
        atDocumentEnd: false,
      }),
    ).toEqual([1])
  })

  it('does not lose short sections crossed during a fast scroll', () => {
    expect(
      collectVisitedSceneIndices({
        scenes,
        // Current rectangles are above the viewport, but their document anchors were crossed
        // between the previous and current reading-line positions.
        positions: [
          { index: 0, top: -1300, bottom: -1250 },
          { index: 1, top: -700, bottom: -650 },
          { index: 2, top: -100, bottom: -50 },
        ],
        previousScrollY: 0,
        currentScrollY: 2500,
        viewportHeight: 1000,
        navigationTargetIndex: null,
        atDocumentEnd: false,
      }),
    ).toEqual([0, 1, 2])
  })

  it('a TOC jump visits only its destination, not every earlier section', () => {
    expect(
      collectVisitedSceneIndices({
        scenes,
        positions: [
          { index: 0, top: -1300, bottom: -1200 },
          { index: 1, top: -700, bottom: -600 },
          { index: 2, top: 100, bottom: 500 },
        ],
        previousScrollY: 0,
        currentScrollY: 2500,
        viewportHeight: 1000,
        navigationTargetIndex: 2,
        atDocumentEnd: false,
      }),
    ).toEqual([2])
  })

  it('records the final passive section at the document end without completing a checkpoint', () => {
    expect(
      collectVisitedSceneIndices({
        scenes,
        positions: [
          { index: 3, top: -200, bottom: -100 },
          { index: 4, top: 920, bottom: 1120 },
        ],
        previousScrollY: 1800,
        currentScrollY: 2200,
        viewportHeight: 1000,
        navigationTargetIndex: null,
        atDocumentEnd: true,
      }),
    ).toEqual([3])
  })

  it('keeps completed visits when an older server response arrives later', () => {
    const merged = mergeCompletedSceneIds(
      ['scene-01', 'scene-02', 'scene-03'],
      ['scene-01'],
      scenes.map((item) => item.id),
    )
    expect(merged).toEqual(['scene-01', 'scene-02', 'scene-03'])
    expect(completedSceneCount([...merged, 'removed-scene'], scenes)).toBe(3)
  })

  it('selects the last scene as current when the reader reaches the document end', () => {
    expect(
      findActiveSceneIndex(
        [
          { index: 3, top: -200, bottom: 100 },
          { index: 4, top: 500, bottom: 900 },
        ],
        800,
        3,
        true,
      ),
    ).toBe(4)
  })
})
