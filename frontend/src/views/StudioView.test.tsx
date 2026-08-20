import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StudioView } from './StudioView'
import { clearPracticeCatalogCacheForTests } from '../features/practice/catalog'

const sqlCatalog = {
  format: 'datapath-sql-praktikum',
  version: '3.1',
  source: 'SQL Praktikum v3.1',
  dataset: { name: 'Olist', variant: 'sample', database: 'olist.sqlite', size_bytes: 10 },
  sections: [],
  schema: {},
  tasks: [{ id: 'start_01', title: 'Первый запрос' }],
}
const algorithmCatalog = {
  format: 'datapath-algopath',
  version: '1.0',
  source: 'AlgoPath',
  problems: [{ slug: 'two-sum', title: 'Two Sum' }],
}

function fetchCatalogs(input: RequestInfo | URL) {
  const url = String(input)
  if (url.includes('sql-praktikum.json'))
    return Promise.resolve(new Response(JSON.stringify(sqlCatalog)))
  if (url.includes('algopath.json'))
    return Promise.resolve(new Response(JSON.stringify(algorithmCatalog)))
  return Promise.resolve(new Response('{}', { status: 404 }))
}

describe('integrated Practice hub', () => {
  beforeEach(() => {
    window.localStorage.clear()
    clearPracticeCatalogCacheForTests()
    vi.stubGlobal('fetch', vi.fn(fetchCatalogs) as unknown as typeof fetch)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows exactly the two integrated practice projects', async () => {
    render(
      <MemoryRouter>
        <StudioView />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: /Два тренажёра/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /SQL для аналитики/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Python-алгоритмы/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Начать SQL/ })).toHaveAttribute(
      'href',
      '/studio/sql/start_01',
    )
    expect(screen.getByRole('link', { name: /Начать AlgoPath/ })).toHaveAttribute(
      'href',
      '/studio/algorithms/two-sum',
    )
  })

  it('does not expose the removed legacy case library', async () => {
    render(
      <MemoryRouter>
        <StudioView />
      </MemoryRouter>,
    )
    await screen.findByText(/SQL Praktikum v3.1/)
    expect(screen.queryByText(/Mini-cases/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Итоговый кейс/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/pandas/i)).not.toBeInTheDocument()
  })
})
