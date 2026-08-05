import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SceneView } from './SceneView'
import type { LessonScene } from '../../lib/api'

/** Поведение code-сцен: бейдж языка не должен отвлекать на plain-text блоках. */
describe('SceneView code scenes', () => {
  function codeScene(language: string | null): LessonScene {
    return {
      id: 'scene-code',
      type: 'code',
      title: 'Пример кода',
      language,
      code: 'print("hello")',
    }
  }

  it('не показывает бейдж «text» для plain-text блоков', () => {
    render(<SceneView scene={codeScene('text')} />)
    expect(screen.queryByText('text')).not.toBeInTheDocument()
    expect(screen.getByText('код')).toBeInTheDocument()
    expect(screen.getByText(/print/)).toBeInTheDocument()
  })

  it('не показывает бейдж, когда язык не указан', () => {
    render(<SceneView scene={codeScene(null)} />)
    expect(screen.getByText('код')).toBeInTheDocument()
  })

  it('сохраняет полезные метки языков (python, sql, bash)', () => {
    for (const language of ['python', 'sql', 'bash']) {
      const { unmount } = render(<SceneView scene={codeScene(language)} />)
      expect(screen.getByText(language)).toBeInTheDocument()
      unmount()
    }
  })
})
