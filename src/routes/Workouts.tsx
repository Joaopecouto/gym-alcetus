import { PageHeader } from '@/components/layout/PageHeader'

export function WorkoutsRoute() {
  return (
    <div className="pb-4">
      <PageHeader
        title="Treinos e planos"
        subtitle="Crie templates de treino e monte seu planejamento semanal."
      />
      <div className="mx-4 mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Em breve: editor de treinos (hipertrofia/força) e plano semanal.
      </div>
    </div>
  )
}
