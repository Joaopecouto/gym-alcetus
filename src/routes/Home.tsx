import { PageHeader } from '@/components/layout/PageHeader'
import { Flame, Play } from 'lucide-react'

export function HomeRoute() {
  return (
    <div className="pb-4">
      <PageHeader
        title="Bom treino 💪"
        subtitle="Seu resumo de hoje aparecerá aqui quando tiver um plano ativo."
      />

      <section className="grid gap-3 px-4 pt-4">
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl bg-primary p-5 text-left text-primary-foreground shadow-sm transition active:scale-[0.99]"
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-primary-foreground/15">
            <Play className="size-5" />
          </div>
          <div>
            <p className="text-base font-semibold">Iniciar treino livre</p>
            <p className="text-sm opacity-90">
              Escolher um template ou montar na hora
            </p>
          </div>
        </button>

        <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="size-4 text-primary" />
            <span>Sequência atual</span>
          </div>
          <p className="mt-2 text-3xl font-semibold">0 dias</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre seu primeiro treino para começar a sequência.
          </p>
        </div>
      </section>
    </div>
  )
}
