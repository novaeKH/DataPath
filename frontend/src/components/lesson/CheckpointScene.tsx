import { useRef, useState } from 'react'
import type { LessonScene } from '../../lib/api'
import { MarkdownContent } from './MarkdownContent'

export interface AssessmentAttempt {
  sceneId: string
  assessmentType: NonNullable<LessonScene['assessment_type']>
  outcome: string
  correct: boolean | null
}

/**
 * Real checkpoint interaction.
 *
 * Backend owns: checkpoint ID, question, answer state.
 * Frontend owns: rendering, selection, submission, feedback.
 *
 * Flow:
 * 1. Show question + options (or text input).
 * 2. Prevent submit without selection.
 * 3. Submit → check against correct answer.
 * 4. Show correct/incorrect feedback + explanation.
 * 5. Keep learner's answer visible; identify correct answer.
 * 6. Prevent double submission.
 * 7. Keyboard: Enter submits when option selected.
 */
export function CheckpointScene({
  scene,
  completed = false,
  onAttempt,
}: {
  scene: LessonScene
  completed?: boolean
  onAttempt?: (attempt: AssessmentAttempt) => void | Promise<void>
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [response, setResponse] = useState('')
  const [submitted, setSubmitted] = useState(completed)
  const [result, setResult] = useState<{
    correct: boolean
    selectedIds: string[]
    correctIds: string[]
  } | null>(null)
  const submittingRef = useRef(false)

  // Parse structured checkpoint from markdown question
  const parsed = parseCheckpoint(scene.question ?? '')
  const inferredType = inferAssessmentType(parsed)
  const assessmentType = scene.assessment_type ?? inferredType
  const isSelfAssessment = assessmentType === 'self_assessment'
  const isReflection = assessmentType === 'reflection' || assessmentType === 'free_response'
  const isMultiple = assessmentType === 'multiple_choice_quiz'
  const isObjective =
    assessmentType === 'single_choice_quiz' || assessmentType === 'multiple_choice_quiz'
  const correctIds = parsed.options.filter((option) => option.correct).map((option) => option.id)
  const invalidObjective = isObjective && correctIds.length === 0

  const handleSelect = (optionId: string) => {
    if (submitted) return
    setSelectedIds((current) =>
      isMultiple
        ? current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId]
        : [optionId],
    )
  }

  const handleSubmit = () => {
    const hasAnswer = isReflection ? response.trim().length > 0 : selectedIds.length > 0
    if (!hasAnswer || invalidObjective || submitted || submittingRef.current) return
    submittingRef.current = true

    const selected = [...selectedIds].sort()
    const expected = [...correctIds].sort()
    const isCorrect =
      !isObjective ||
      (selected.length === expected.length && selected.every((id, index) => id === expected[index]))

    setResult({ correct: isCorrect, selectedIds, correctIds })
    setSubmitted(true)
    const outcome = isSelfAssessment
      ? ({ a: 'self_confident', b: 'self_review', c: 'self_uncertain' }[selectedIds[0]] ??
        'self_review')
      : isObjective
        ? isCorrect
          ? 'correct'
          : 'incorrect'
        : 'reflection'
    void onAttempt?.({
      sceneId: scene.id,
      assessmentType,
      outcome,
      correct: isObjective ? isCorrect : null,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent, optionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!submitted) handleSelect(optionId)
    }
  }

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (selectedIds.length > 0 || response.trim()) && !submitted) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <section
      className="dp-scene rounded-xl px-5 py-5"
      style={{
        background: 'var(--dp-accent-subtle)',
        border: '1px solid var(--dp-accent-border)',
      }}
    >
      <div
        className="mb-2 text-xs font-bold uppercase tracking-wide"
        style={{ color: 'var(--dp-accent)' }}
      >
        {isSelfAssessment ? 'Самооценка' : isReflection ? 'Короткий ответ' : 'Проверка понимания'}
      </div>

      <h3 className="text-[15px] font-semibold mb-3" style={{ color: 'var(--dp-text-primary)' }}>
        {parsed.question}
      </h3>

      {parsed.code && (
        <pre
          className="mb-3 overflow-x-auto rounded-lg p-3 text-[13px] leading-relaxed"
          style={{
            background: 'var(--dp-code-bg)',
            border: '1px solid var(--dp-code-border)',
            color: 'var(--dp-text-primary)',
          }}
        >
          <code>{parsed.code}</code>
        </pre>
      )}

      {/* Options */}
      {!isReflection && (
        <div
          className="flex flex-col gap-2 mb-3"
          role={isMultiple ? 'group' : 'radiogroup'}
          onKeyDown={handleFormKeyDown}
        >
          {parsed.options.map((option) => {
            const isSelected = selectedIds.includes(option.id)
            const isSubmittedCorrect =
              isObjective && result && result.correctIds.includes(option.id)
            const isSubmittedIncorrect =
              isObjective && result && !result.correctIds.includes(option.id) && isSelected
            const isSavedSelfAssessment = isSelfAssessment && submitted && isSelected

            return (
              <button
                key={option.id}
                role={isMultiple ? 'checkbox' : 'radio'}
                aria-checked={isSelected}
                onClick={() => handleSelect(option.id)}
                onKeyDown={(e) => handleKeyDown(e, option.id)}
                disabled={submitted}
                className="flex items-start gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors duration-150 w-full"
                style={{
                  background: submitted
                    ? isSubmittedCorrect
                      ? 'var(--dp-success-subtle)'
                      : isSubmittedIncorrect
                        ? 'var(--dp-error-subtle)'
                        : isSavedSelfAssessment
                          ? 'var(--dp-accent-subtle)'
                          : 'transparent'
                    : isSelected
                      ? 'var(--dp-surface-interactive)'
                      : 'transparent',
                  border: `1.5px solid ${
                    submitted
                      ? isSubmittedCorrect
                        ? 'var(--dp-success)'
                        : isSubmittedIncorrect
                          ? 'var(--dp-error)'
                          : isSavedSelfAssessment
                            ? 'var(--dp-accent)'
                            : 'var(--dp-border-subtle)'
                      : isSelected
                        ? 'var(--dp-accent)'
                        : 'var(--dp-border-subtle)'
                  }`,
                  color: 'var(--dp-text-primary)',
                  cursor: submitted ? 'default' : 'pointer',
                  opacity:
                    submitted && isObjective && !isSubmittedCorrect && !isSubmittedIncorrect
                      ? 0.6
                      : 1,
                }}
              >
                {/* Radio indicator */}
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5"
                  style={{
                    borderColor: submitted
                      ? isSubmittedCorrect
                        ? 'var(--dp-success)'
                        : isSubmittedIncorrect
                          ? 'var(--dp-error)'
                          : isSavedSelfAssessment
                            ? 'var(--dp-accent)'
                            : 'var(--dp-border-strong)'
                      : isSelected
                        ? 'var(--dp-accent)'
                        : 'var(--dp-border-strong)',
                  }}
                >
                  {(isSelected || isSubmittedCorrect || isSubmittedIncorrect) && (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: submitted
                          ? isSubmittedCorrect
                            ? 'var(--dp-success)'
                            : isSubmittedIncorrect
                              ? 'var(--dp-error)'
                              : isSavedSelfAssessment
                                ? 'var(--dp-accent)'
                                : 'var(--dp-border-strong)'
                          : 'var(--dp-accent)',
                      }}
                    />
                  )}
                </span>

                {/* Option text */}
                <span className="flex-1">
                  <span
                    className="font-mono text-xs mr-2"
                    style={{ color: 'var(--dp-text-muted)' }}
                  >
                    {option.id.toUpperCase()}
                  </span>
                  {option.text}
                </span>

                {/* Result icon */}
                {submitted && isSubmittedCorrect && (
                  <span className="shrink-0 text-sm" style={{ color: 'var(--dp-success)' }}>
                    ✓
                  </span>
                )}
                {submitted && isSubmittedIncorrect && (
                  <span className="shrink-0 text-sm" style={{ color: 'var(--dp-error)' }}>
                    ✗
                  </span>
                )}
                {isSavedSelfAssessment && (
                  <span className="shrink-0 text-sm" style={{ color: 'var(--dp-accent)' }}>
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {isReflection && (
        <textarea
          aria-label="Ответ"
          value={response}
          onChange={(event) => setResponse(event.target.value)}
          disabled={submitted}
          rows={5}
          placeholder="Сформулируйте ответ своими словами…"
          className="mb-3 w-full resize-y rounded-lg px-4 py-3 text-sm outline-none"
          style={{
            background: 'var(--dp-surface)',
            border: '1px solid var(--dp-border-strong)',
            color: 'var(--dp-text-primary)',
          }}
        />
      )}

      {invalidObjective && (
        <p className="mb-3 text-sm" role="alert" style={{ color: 'var(--dp-error)' }}>
          Проверка временно недоступна: в задании не задан правильный ответ.
        </p>
      )}

      {/* Submit button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={
            invalidObjective || (isReflection ? !response.trim() : selectedIds.length === 0)
          }
          className="rounded-lg px-5 py-2 text-sm font-semibold transition-colors duration-150 disabled:opacity-40"
          style={{
            background:
              (isReflection ? response.trim() : selectedIds.length > 0) && !invalidObjective
                ? 'var(--dp-accent)'
                : 'var(--dp-border-subtle)',
            color:
              (isReflection ? response.trim() : selectedIds.length > 0) && !invalidObjective
                ? 'white'
                : 'var(--dp-text-muted)',
          }}
        >
          {isSelfAssessment
            ? 'Сохранить самооценку'
            : isReflection
              ? 'Сохранить ответ'
              : 'Проверить ответ'}
        </button>
      )}

      {/* Feedback */}
      {result && (
        <div
          className="mt-3 rounded-lg px-4 py-3 text-sm"
          style={{
            background:
              isObjective && !result.correct
                ? 'var(--dp-error-subtle)'
                : 'var(--dp-success-subtle)',
            color: isObjective && !result.correct ? 'var(--dp-error)' : 'var(--dp-success)',
          }}
        >
          {isSelfAssessment ? (
            <p className="font-semibold">
              {selectedIds[0] === 'b'
                ? 'Отметили для повторения.'
                : selectedIds[0] === 'c'
                  ? 'Сохранили: тема вернётся в Review раньше.'
                  : 'Самооценка сохранена.'}
            </p>
          ) : isReflection ? (
            <p className="font-semibold">Ответ сохранён. Сравните его с разбором ниже.</p>
          ) : result.correct ? (
            <p className="font-semibold">Правильно.</p>
          ) : (
            <div>
              <p className="font-semibold">
                Неверно — разберите различие и попробуйте снова позже.
              </p>
              <p className="mt-1">
                Правильный ответ:{' '}
                {result.correctIds
                  .map((id) => {
                    const opt = parsed.options.find((o) => o.id === id)
                    return opt ? `${id.toUpperCase()}) ${opt.text}` : id
                  })
                  .join(', ')}
              </p>
            </div>
          )}
          {parsed.explanation && (
            <div
              className="mt-2 pt-2"
              style={{ borderTop: '1px solid currentColor', opacity: 0.5 }}
            >
              <MarkdownContent markdown={parsed.explanation} />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * Parse structured checkpoint from markdown question text.
 *
 * Expected format in vault:
 * ```
 * Что делает GroupKFold?
 * - [ ] RandomSplit
 * - [x] Group split по user_id
 * - [ ] Fit scaler на всех данных
 *
 * *Объяснение:* Все строки одного пользователя должны быть в одном fold.
 * ```
 */
interface ParsedCheckpoint {
  question: string
  options: { id: string; text: string; correct: boolean }[]
  code?: string
  explanation?: string
}

function inferAssessmentType(
  checkpoint: ParsedCheckpoint,
): NonNullable<LessonScene['assessment_type']> {
  const correctCount = checkpoint.options.filter((option) => option.correct).length
  if (correctCount > 1) return 'multiple_choice_quiz'
  if (correctCount === 1) return 'single_choice_quiz'
  return 'self_assessment'
}

function parseCheckpoint(markdown: string): ParsedCheckpoint {
  const lines = markdown.split('\n')
  const questionLines: string[] = []
  const options: ParsedCheckpoint['options'] = []
  const codeLines: string[] = []
  const explanationLines: string[] = []
  let mode: 'question' | 'code' | 'options' | 'explanation' = 'question'
  let inCodeBlock = false
  const optionLetters = 'abcdefghij'

  for (const line of lines) {
    const trimmed = line.trim()

    // Code block
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        codeLines.push(trimmed)
        inCodeBlock = false
        continue
      } else {
        inCodeBlock = true
        codeLines.push(trimmed)
        if (mode === 'question') mode = 'code'
        continue
      }
    }
    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // Option line: "- [x] text" or "- [ ] text" or "1. text"
    const optionMatch = trimmed.match(/^[-*]\s*\[([xX\s])\]\s+(.+)$/)
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/)

    if (optionMatch) {
      mode = 'options'
      const isCorrect = optionMatch[1].toLowerCase() === 'x'
      const text = optionMatch[2].trim()
      const id = optionLetters[options.length] ?? String(options.length)
      options.push({ id, text, correct: isCorrect })
      continue
    }

    if (numberedMatch && mode !== 'explanation' && mode !== 'question') {
      mode = 'options'
      const text = numberedMatch[2].trim()
      const id = optionLetters[options.length] ?? String(options.length)
      // Numbered lists all assumed correct (checklist style)
      options.push({ id, text, correct: false })
      continue
    }

    // Explanation marker
    if (
      trimmed.startsWith('*Объяснение:') ||
      trimmed.startsWith('*Пояснение:') ||
      trimmed.startsWith('**Объяснение:') ||
      trimmed.startsWith('**Пояснение:')
    ) {
      mode = 'explanation'
      explanationLines.push(
        trimmed.replace(/^\*+Объяснение:\s*/, '').replace(/^\*+Пояснение:\s*/, ''),
      )
      continue
    }

    if (mode === 'explanation') {
      explanationLines.push(line)
      continue
    }

    // Everything else in question mode
    if (mode === 'question' && trimmed) {
      questionLines.push(line)
    }
  }

  const question = questionLines.join('\n').trim()
  const code = codeLines.join('\n').trim() || undefined
  const explanation = explanationLines.join('\n').trim() || undefined

  // If no structured options were found, create self-check format
  if (options.length === 0 && question) {
    return {
      question: question.replace(/^[-*]\s+/, '').trim(),
      options: [
        { id: 'a', text: 'Знаю и могу объяснить', correct: false },
        { id: 'b', text: 'Понимаю, но нужно повторить', correct: false },
        { id: 'c', text: 'Пока не уверен(а)', correct: false },
      ],
      code,
      explanation,
    }
  }

  return { question, options, code, explanation }
}
