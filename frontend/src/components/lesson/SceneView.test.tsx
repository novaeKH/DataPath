import { fireEvent, render, screen } from '@testing-library/react'
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

describe('SceneView visual demos', () => {
  it('renders demo_id and recomputes the visualization after a slider change', async () => {
    render(
      <SceneView
        scene={{
          id: 'scene-visual',
          type: 'visual_demo',
          title: 'Интерактивная визуализация',
          demo_id: 'boosting-residuals-lab',
        }}
      />,
    )

    expect(await screen.findByText('1.188')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: /Learning rate/ }), {
      target: { value: '1' },
    })
    expect(screen.getByText('0.750')).toBeInTheDocument()
  })

  it('renders a lesson-specific concept flow and advances between stages', async () => {
    render(
      <SceneView
        scene={{
          id: 'scene-concept-flow',
          type: 'visual_demo',
          title: 'Интерактивная схема темы',
          demo_id: 'python-object-reference-flow',
        }}
      />,
    )

    expect(await screen.findByText(/Python создаёт объект/)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: /Шаг/ }), { target: { value: '3' } })
    expect(screen.getByText(/Изменение объекта видно/)).toBeInTheDocument()
    expect(screen.getByText('Шаг 4: Мутация')).toBeInTheDocument()
  })
})
