import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LessonScene } from '../../lib/api'
import { CheckpointScene } from './CheckpointScene'

function checkpoint(overrides: Partial<LessonScene> = {}): LessonScene {
  return {
    id: 'scene-checkpoint',
    type: 'checkpoint',
    question: 'Объясните идею своими словами.',
    ...overrides,
  }
}

describe('CheckpointScene assessment semantics', () => {
  it('сохраняет уровень уверенности без correct/incorrect feedback', async () => {
    const user = userEvent.setup()
    const onAttempt = vi.fn()
    render(
      <CheckpointScene
        scene={checkpoint({ assessment_type: 'self_assessment' })}
        onAttempt={onAttempt}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Понимаю, но нужно повторить/ }))
    await user.click(screen.getByRole('button', { name: 'Сохранить самооценку' }))

    expect(screen.getByText(/Отметили для повторения/)).toBeInTheDocument()
    expect(screen.queryByText(/Неверно/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Правильный ответ/)).not.toBeInTheDocument()
    expect(onAttempt).toHaveBeenCalledWith({
      sceneId: 'scene-checkpoint',
      assessmentType: 'self_assessment',
      outcome: 'self_review',
      correct: null,
    })
  })

  it('показывает непустой правильный ответ factual quiz', async () => {
    const user = userEvent.setup()
    render(
      <CheckpointScene
        scene={checkpoint({
          assessment_type: 'single_choice_quiz',
          question:
            'Почему Random Forest снижает variance?\n- [x] Усредняет декоррелированные деревья\n- [ ] Использует одно глубокое дерево',
        })}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /одно глубокое дерево/i }))
    await user.click(screen.getByRole('button', { name: 'Проверить ответ' }))

    expect(screen.getByText(/Неверно/)).toBeInTheDocument()
    expect(screen.getByText(/A\) Усредняет декоррелированные деревья/)).toBeInTheDocument()
  })
})
