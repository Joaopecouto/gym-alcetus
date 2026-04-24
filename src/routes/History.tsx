import { PageHeader } from '@/components/layout/PageHeader'

export function HistoryRoute() {
  return (
    <div className="pb-4">
      <PageHeader
        title="Histórico"
        subtitle="Todos os seus treinos, filtrados por período."
      />
      <div className="mx-4 mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Em breve: filtros (hoje/semana/mês/ano/tudo), métricas e detalhe por sessão.
      </div>
    </div>
  )
}
