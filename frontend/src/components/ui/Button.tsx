import type { ButtonHTMLAttributes } from 'react'
import { buttonClassNames } from './buttonStyles'

/**
 * Единые кнопки DataPath.
 *
 * Варианты:
 * - primary   — главное действие страницы (брендовый emerald);
 * - secondary — сильное нейтральное действие (инвертированный slate);
 * - outline   — второстепенное действие с рамкой;
 * - ghost     — текстовое действие без рамки;
 * - danger    — опасное/деструктивное действие.
 *
 * Все состояния (hover/active/focus-visible/disabled) единые; target ≥ 44px
 * для важных touch-контролов достигается размером lg или padding.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'outline',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClassNames(variant, size, className)} {...props} />
}
