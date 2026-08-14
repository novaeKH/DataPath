import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InlineMarkdownContent, MarkdownContent } from './MarkdownContent'
import { SceneView } from './SceneView'
import { LessonOutline } from './LessonOutline'
import type { LessonScene } from '../../lib/api'

function scene(overrides: Partial<LessonScene>): LessonScene {
  return {
    id: 'scene-01',
    type: 'markdown',
    title: null,
    display_title: null,
    markdown: '',
    ...overrides,
  } as LessonScene
}

/** Считает отрендеренные KaTeX-элементы (block + inline). */
function katexCount(container: HTMLElement): number {
  return container.querySelectorAll('.katex').length
}

describe('MarkdownContent — inline math (Фаза 6A)', () => {
  it('renders $n$ as inline math in ordinary markdown', () => {
    const { container } = render(<MarkdownContent markdown="Для node с $n$ objects." />)
    expect(katexCount(container)).toBe(1)
    expect(container.textContent).not.toContain('$n$')
  })

  it('renders $I$ inline variable in a formula explanation', () => {
    const { container } = render(<MarkdownContent markdown="$I$ — impurity или loss." />)
    expect(katexCount(container)).toBe(1)
    expect(container.textContent).not.toContain('$I$')
  })

  it('renders subscript $n_L$ via KaTeX', () => {
    const { container } = render(<MarkdownContent markdown="Числитель содержит $n_L$ объектов." />)
    expect(katexCount(container)).toBe(1)
    expect(container.textContent).not.toContain('$n_L$')
    expect(container.textContent).not.toContain('$n')
  })

  it('renders several inline expressions in one paragraph', () => {
    const { container } = render(
      <MarkdownContent markdown="Если $p_k$ — доля класса $k$, Gini = $1-\\sum p_k^2$." />,
    )
    expect(katexCount(container)).toBeGreaterThanOrEqual(3)
    expect(container.textContent).not.toContain('$p_k$')
  })

  it('renders inline math in a list item', () => {
    const { container } = render(
      <MarkdownContent markdown="- параметр $\\lambda$ управляет силой;\n- $\\Omega$ — сложность." />,
    )
    expect(katexCount(container)).toBeGreaterThanOrEqual(2)
    expect(container.textContent).not.toContain('$\\lambda$')
  })

  it('does not crash on malformed inline math (fallback)', () => {
    // $x$ без закрывающего доллара — KaTeX fallback (throwOnError: false)
    const { container } = render(<MarkdownContent markdown="Некорректная формула $x_{unclosed" />)
    // Сцена не падает; контент всё равно отображается
    expect(container.textContent).toContain('Некорректная формула')
  })

  it('keeps escaped ordinary dollar symbols', () => {
    const { container } = render(<MarkdownContent markdown="Цена — \\$5 за штуку." />)
    // Никакого KaTeX для escape-доллара
    expect(katexCount(container)).toBe(0)
    expect(container.textContent).toContain('$5')
  })

  it('keeps an existing block formula working', () => {
    const { container } = render(
      <MarkdownContent
        markdown={
          '$$\n\\operatorname{Gain} = I(\\text{parent}) - \\frac{n_L}{n}I(\\text{left}).\n$$'
        }
      />,
    )
    expect(katexCount(container)).toBeGreaterThanOrEqual(1)
  })

  it('renders canonical multiplication instead of showing raw \\cdot text', () => {
    const { container } = render(<MarkdownContent markdown={'$$\n2\\cdot16+16=48.\n$$'} />)
    expect(katexCount(container)).toBeGreaterThanOrEqual(1)
    const visibleFormula = container.querySelector('.katex-html')?.textContent ?? ''
    expect(visibleFormula).not.toContain('\\cdot')
    expect(visibleFormula).toContain('2⋅16')
  })

  it('renders inline math inside a compact scene heading', () => {
    const { container } = render(
      <InlineMarkdownContent markdown={'Почему делим на $\\sqrt{d_k}$'} />,
    )
    expect(katexCount(container)).toBe(1)
    expect(container.querySelector('p')).toBeNull()
    expect(container.querySelector('.katex-html')?.textContent).toContain('dk')
  })

  it('keeps a numbered section title inline instead of creating a list', () => {
    const { container } = render(<InlineMarkdownContent markdown="3. Механика split" />)
    expect(container.querySelector('ol')).toBeNull()
    expect(container.textContent).toBe('3. Механика split')
  })

  it('renders Gain fraction with n_L and n_R as real subscripts', () => {
    const { container } = render(
      <MarkdownContent
        markdown={
          '$$\n\\operatorname{Gain} = I(\\text{parent}) - \\frac{n_L}{n}I(\\text{left}) - \\frac{n_R}{n}I(\\text{right}).\n$$'
        }
      />,
    )
    const msubsup = container.querySelectorAll('.katex .msupsub')
    // Оба числителя имеют подстрочные L и R
    expect(msubsup.length).toBe(2)
    const subText = container.querySelector('.katex')?.textContent ?? ''
    expect(subText).toContain('L')
    expect(subText).toContain('R')
    // inline style должен присутствовать (без него подстрочные опускаются)
    const styled = container.querySelectorAll('.katex [style]').length
    expect(styled).toBeGreaterThan(0)
  })
})

describe('MarkdownContent — list markers (Фаза 6A)', () => {
  it('renders ul with visible markers', () => {
    const { container } = render(
      <MarkdownContent
        markdown={'Сравнивать нужно:\n\n- на одинаковых folds;\n- с early stopping;'}
      />,
    )
    const ul = container.querySelector('ul')
    expect(ul).not.toBeNull()
    expect(ul?.className).toContain('list-disc')
    expect(container.querySelectorAll('li').length).toBe(2)
  })

  it('renders ol with decimal markers', () => {
    const { container } = render(
      <MarkdownContent markdown={'1. Зафиксировать split.\n2. Дать итерации.'} />,
    )
    const ol = container.querySelector('ol')
    expect(ol?.className).toContain('list-decimal')
    expect(container.querySelectorAll('li').length).toBe(2)
  })

  it('keeps nested lists', () => {
    const { container } = render(
      <MarkdownContent markdown={'- Уровень 1\n  - Уровень 1.1\n- Уровень 2'} />,
    )
    expect(container.querySelector('ul ul')).not.toBeNull()
  })
})

describe('SceneView — display_title и inline math в explanation (Фаза 6A)', () => {
  it('formula scene renders explanation through the Markdown/KaTeX pipeline', () => {
    const formulaScene = scene({
      type: 'formula',
      display_title: 'Split gain',
      intro: 'Для node с $n$ objects:',
      formula: '\\operatorname{Gain} = I(\\text{parent}) - \\frac{n_L}{n}I(\\text{left})',
      explanation: '$I$ — impurity.',
    })
    const { container } = render(<SceneView scene={formulaScene} />)
    expect(container.textContent).toContain('Split gain')
    // Инлайн-математика в explanation отрендерена, без сырых $
    expect(container.textContent).not.toContain('$n$')
    expect(container.textContent).not.toContain('$I$')
    expect(katexCount(container)).toBeGreaterThanOrEqual(3)
    const intro = container.querySelector('.dp-example-intro')
    const formula = container.querySelector('.dp-formula-block')
    const caption = container.querySelector('.dp-example-caption')
    if (!intro || !formula || !caption) throw new Error('formula learning sequence is incomplete')
    expect(intro.compareDocumentPosition(formula) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(formula.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('code scene renders caption with inline math', () => {
    const codeScene = scene({
      type: 'code',
      display_title: 'Пример',
      language: 'python',
      code: 'x = 1',
      caption: 'При $\\lambda$ = 0.1 loss меньше.',
    })
    const { container } = render(<SceneView scene={codeScene} />)
    expect(container.textContent).not.toContain('$\\lambda$')
  })

  it('keeps explanation before code and result after code', () => {
    const codeScene = scene({
      type: 'code',
      intro: 'Сначала создаём независимый список:',
      language: 'python',
      code: 'items = list(source)',
      caption: 'Теперь изменение не затронет source.',
    })
    const { container } = render(<SceneView scene={codeScene} />)
    const intro = container.querySelector('.dp-example-intro')
    const code = container.querySelector('.dp-code-example')
    const caption = container.querySelector('.dp-example-caption')

    expect(intro?.textContent).toContain('Сначала')
    expect(caption?.textContent).toContain('Теперь')
    if (!intro || !code || !caption) throw new Error('code learning sequence is incomplete')
    expect(intro.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(code.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('turns bad and good labels into accessible contrast cards', () => {
    const { rerender } = render(
      <SceneView
        scene={scene({ type: 'code', intro: 'Плохо:', language: 'python', code: 'users=[]' })}
      />,
    )
    expect(screen.getByText('Плохо')).toBeInTheDocument()
    expect(document.querySelector('.dp-code-example--incorrect')).not.toBeNull()

    rerender(
      <SceneView
        scene={scene({
          type: 'code',
          intro: 'Правильно:',
          language: 'python',
          code: 'users=None',
        })}
      />,
    )
    expect(screen.getByText('Правильно')).toBeInTheDocument()
    expect(document.querySelector('.dp-code-example--correct')).not.toBeNull()
  })

  it('markdown scene prefers display_title over title', () => {
    const mdScene = scene({
      type: 'markdown',
      title: 'Classification criteria',
      display_title: 'Gini',
    })
    const { container } = render(<SceneView scene={mdScene} />)
    expect(container.textContent).toContain('Gini')
  })

  it('markdown scene falls back to title when display_title missing', () => {
    const mdScene = scene({ type: 'markdown', title: 'Идея за 30 секунд' })
    const { container } = render(<SceneView scene={mdScene} />)
    expect(container.textContent).toContain('Идея за 30 секунд')
  })
})

describe('LessonOutline — display_title (Фаза 6A)', () => {
  const onSelect = () => undefined

  it('uses display_title for outline labels', () => {
    const scenes = [
      scene({
        id: 'scene-01',
        type: 'formula',
        title: 'Classification criteria',
        display_title: 'Gini',
      }),
      scene({
        id: 'scene-02',
        type: 'formula',
        title: 'Classification criteria',
        display_title: 'Entropy',
      }),
    ]
    render(<LessonOutline scenes={scenes} currentIndex={0} onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: /Gini/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Entropy/ })).toBeTruthy()
    // Старые дублирующиеся заголовки не должны появляться
    expect(screen.queryByRole('button', { name: 'Classification criteria' })).toBeNull()
  })

  it('keeps lab and checkpoint labels', () => {
    const scenes = [
      scene({ id: 'scene-01', type: 'interactive_lab', lab_id: 'x', lab_title: 'Лаба' }),
      scene({ id: 'scene-02', type: 'checkpoint', question: 'Q' }),
    ]
    render(<LessonOutline scenes={scenes} currentIndex={0} onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: /Лаба/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Проверка 1/ })).toBeTruthy()
  })

  it('uses one source heading for all scenes in the same section', () => {
    const scenes = [
      scene({
        id: 'scene-01',
        type: 'markdown',
        source_heading: '4. Механика split',
        display_title: 'Первое предложение сцены, которое не должно стать пунктом',
      }),
      scene({
        id: 'scene-02',
        type: 'formula',
        source_heading: '4. Механика split',
        display_title: 'Gini',
      }),
    ]
    render(<LessonOutline scenes={scenes} currentIndex={1} onSelect={onSelect} />)
    const section = screen.getByRole('button', { name: '4. Механика split' })
    expect(section).toHaveAttribute('aria-current', 'step')
    expect(screen.queryByRole('button', { name: /Первое предложение/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Gini' })).toBeNull()
  })

  it('does not turn an unheaded prose fragment into a section label', () => {
    const scenes = [
      scene({ id: 'scene-01', type: 'markdown', title: 'После урока вы сможете' }),
      scene({
        id: 'scene-02',
        type: 'markdown',
        display_title: 'как будто x — коробка, в которой лежит число 10…',
      }),
      scene({ id: 'scene-03', type: 'code', source_heading: '1. Имя и объект' }),
    ]
    render(<LessonOutline scenes={scenes} currentIndex={0} onSelect={onSelect} />)
    expect(screen.getByRole('button', { name: 'После урока вы сможете' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '1. Имя и объект' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /как будто x/ })).toBeNull()
  })

  it('compacts an overflowing outline label but keeps the full title', () => {
    const full =
      '10. Почему calibrator нельзя обучать на тех же predictions, где base model уже обучалась'
    render(
      <LessonOutline
        scenes={[scene({ source_heading: full, display_title: full })]}
        currentIndex={0}
        onSelect={onSelect}
      />,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', full)
    expect(button).toHaveTextContent('…')
  })
})

describe('MarkdownContent — security boundary (Фаза 6A)', () => {
  it('renders a teaching figure outside paragraph markup', () => {
    const { container } = render(<MarkdownContent markdown={'![График](plot.png "Подпись")'} />)
    expect(container.querySelector('figure.dp-teaching-figure')).not.toBeNull()
    expect(container.querySelector('p figure')).toBeNull()
    expect(container.querySelector('figcaption')).toHaveTextContent('Подпись')
  })

  it('does not execute raw HTML', () => {
    const { container } = render(
      <MarkdownContent markdown={'<div data-testid="raw">raw html</div>'} />,
    )
    // raw HTML не превращается в DOM-элемент
    expect(container.querySelector('[data-testid="raw"]')).toBeNull()
  })

  it('does not execute <script>', () => {
    const { container } = render(
      <MarkdownContent markdown={'<script>window.__pwned = true</script>text'} />,
    )
    expect(container.querySelector('script')).toBeNull()
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined()
  })

  it('does not preserve event handlers like onclick', () => {
    const { container } = render(
      <MarkdownContent markdown={'<img src="x" onclick="alert(1)" />'} />,
    )
    const img = container.querySelector('img')
    // либо картинка удалена санитайзером, либо без onclick
    if (img) {
      expect(img.hasAttribute('onclick')).toBe(false)
    }
  })

  it('does not inject executable javascript via attributes', () => {
    const { container } = render(<MarkdownContent markdown={'[x](javascript:alert(1))'} />)
    const a = container.querySelector('a')
    if (a) {
      const href = a.getAttribute('href') ?? ''
      expect(href.toLowerCase().startsWith('javascript:')).toBe(false)
    }
  })

  it('keeps KaTeX positioning styles after sanitization', () => {
    const { container } = render(<MarkdownContent markdown={'$$\\frac{n_L}{n}I(\\text{left})$$'} />)
    const styled = container.querySelectorAll('.katex [style]').length
    expect(styled).toBeGreaterThan(0)
    // формула отрендерилась
    expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(1)
  })
})
