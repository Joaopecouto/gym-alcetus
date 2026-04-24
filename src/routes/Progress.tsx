import { PageHeader } from '@/components/layout/PageHeader'

export function ProgressRoute() {
  return (
    <div className="pb-4">
      <PageHeader
        title="Evolução"
        subtitle="Gráficos de carga, 1RM estimado e recordes pessoais."
      />
      <div className="mx-4 mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Em breve: gráficos Recharts de 1RM, peso corporal e volume semanal.
      </div>
    </div>
  )
}
