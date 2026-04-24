import { PageHeader } from '@/components/layout/PageHeader'

export function LibraryRoute() {
  return (
    <div className="pb-4">
      <PageHeader
        title="Biblioteca de exercícios"
        subtitle="Explore, favorite e crie seus próprios exercícios."
      />
      <div className="mx-4 mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Em breve: listagem com busca, filtros e exercícios customizados.
      </div>
    </div>
  )
}
