import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  actions?: ReactNode
  hideClose?: boolean
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  hideClose,
}: DialogProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl',
          'animate-in fade-in slide-in-from-bottom-4 duration-150',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {!hideClose ? (
            <button
              type="button"
              onClick={onClose}
              className="-m-1 rounded-full p-1 text-muted-foreground hover:bg-accent"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        {actions ? (
          <div className="mt-5 flex justify-end gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
