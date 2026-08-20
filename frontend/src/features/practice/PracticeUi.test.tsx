import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditorTextarea } from './PracticeUi'

describe('practice code editor', () => {
  it('highlights Python language structure without replacing the native textarea', () => {
    const source = 'def solve(nums: List[int]) -> int:\n    nums.append(1)\n    return len(nums)'
    const { container } = render(
      <EditorTextarea
        value={source}
        onChange={() => undefined}
        language="python"
        ariaLabel="Python-редактор"
      />,
    )

    expect(screen.getByLabelText('Python-редактор')).toHaveValue(source)
    expect(container.querySelector('.tok-keyword')).toHaveTextContent('def')
    expect(container.querySelector('.tok-definition')).toHaveTextContent('solve')
    expect(container.querySelector('.tok-method')).toHaveTextContent('append')
    expect(container.querySelector('.tok-function')).toHaveTextContent('len')
    expect(container.querySelector('.tok-type')).toHaveTextContent('List')
    expect(container.querySelectorAll('.dp-code-line-numbers span')).toHaveLength(3)
  })

  it('highlights SQL keywords, functions and numbers', () => {
    const { container } = render(
      <EditorTextarea
        value="SELECT COUNT(*) AS total FROM orders WHERE price >= 100"
        onChange={() => undefined}
        language="sql"
        ariaLabel="SQL-редактор"
      />,
    )

    expect([...container.querySelectorAll('.tok-keyword')].map((node) => node.textContent)).toEqual(
      expect.arrayContaining(['SELECT', 'AS', 'FROM', 'WHERE']),
    )
    expect(container.querySelector('.tok-function')).toHaveTextContent('COUNT')
    expect(container.querySelector('.tok-number')).toHaveTextContent('100')
  })

  it('inserts indentation when Tab is pressed', () => {
    const onChange = vi.fn()
    render(
      <EditorTextarea
        value="return value"
        onChange={onChange}
        language="python"
        ariaLabel="Python-редактор"
      />,
    )
    const editor = screen.getByLabelText('Python-редактор') as HTMLTextAreaElement
    editor.setSelectionRange(0, 0)
    fireEvent.keyDown(editor, { key: 'Tab' })
    expect(onChange).toHaveBeenCalledWith('    return value')
  })
})
