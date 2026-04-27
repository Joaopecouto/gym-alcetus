import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Linha rolável horizontalmente — usada pra chips/filtros que extrapolam
 * a largura da viewport em mobile. Esconde a scrollbar mas mantém o
 * comportamento touch-friendly.
 *
 * Pattern: container com `overflow-x-auto` + filhos com `flex-shrink-0`
 * (cada chip já vem com `shrink-0`).
 *
 * `bleed`: estende pra além do padding lateral pra que o scroll comece
 * desde a borda da tela (visual mais agradável em mobile).
 */
export function ScrollRow({
  children,
  bleed = false,
  className,
}: {
  children: ReactNode
  bleed?: boolean
  className?: string
}) {
  // Inline style pra garantir que funciona em todos os navegadores
  // (Tailwind arbitrary classes pra scrollbar às vezes falham).
  const style: CSSProperties = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    WebkitOverflowScrolling: 'touch',
  }

  return (
    <div
      style={style}
      className={cn(
        'flex gap-1.5 overflow-x-auto pb-1',
        '[&::-webkit-scrollbar]:hidden',
        bleed && '-mx-4 px-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
