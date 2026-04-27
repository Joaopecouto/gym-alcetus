import { useEffect, useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useCreateMeasurement } from './queries'

interface Props {
  open: boolean
  onClose: () => void
  /** Peso atual pra pré-preencher o input — geralmente o último registrado. */
  currentWeight: number | null
}

export function WeightDialog({ open, onClose, currentWeight }: Props) {
  const create = useCreateMeasurement()
  const [value, setValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Reseta ao abrir
  useEffect(() => {
    if (open) {
      setValue(currentWeight ? String(currentWeight) : '')
      setError(null)
    }
  }, [open, currentWeight])

  async function submit() {
    const weightKg = Number(value.replace(',', '.'))
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
      setError('Peso deve estar entre 20 e 400 kg.')
      return
    }
    try {
      await create.mutateAsync({ weightKg })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Atualizar peso"
      description="Registra seu peso corporal de hoje. Aparece no gráfico de evolução."
      actions={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="weight">Peso (kg)</Label>
        <Input
          id="weight"
          type="number"
          inputMode="decimal"
          step="0.1"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Pode ser decimal — ex: 75.4
          </p>
        )}
      </div>
    </Dialog>
  )
}
