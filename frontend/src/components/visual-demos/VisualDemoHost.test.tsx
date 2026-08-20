import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisualDemoHost } from './VisualDemoHost'

describe('Linear Regression vertical visualizations', () => {
  it('updates Gaussian likelihood when the residual changes', () => {
    render(<VisualDemoHost demoId="gaussian-noise-lab" />)

    expect(screen.getByText(/относительная плотность 0\.607/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Остаток e/), { target: { value: '3' } })
    expect(screen.getByText(/относительная плотность 0\.011/i)).toBeInTheDocument()
  })

  it('switches the regression chart to the dataset with an outlier', () => {
    render(<VisualDemoHost demoId="linear-fit-residual-lab" />)

    const dataset = screen.getByLabelText('Набор точек')
    fireEvent.change(dataset, { target: { value: 'outlier' } })
    expect(dataset).toHaveValue('outlier')
    expect(screen.getByText(/пунктир — OLS/i)).toBeInTheDocument()
  })
})
