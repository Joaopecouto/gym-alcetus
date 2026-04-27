import { useMemo } from 'react'
import type { Exercise, SessionSet } from '@/types'

/**
 * Boneco humano (frente + costas) com áreas musculares pintadas em vermelho
 * com intensidade proporcional a quanto cada grupo foi trabalhado na sessão.
 *
 * Fórmula:
 *   - séries em primary muscle valem 1.0
 *   - séries em secondary muscles valem 0.5
 *   - normaliza pelo músculo mais trabalhado (max = 1.0)
 *   - opacity vai de 0.25 a 1.0 quando >0
 *
 * SVG simplificado mas reconhecível — silhueta humana minimalista.
 */
export function MuscleHeatmap({
  sets,
  exercises,
}: {
  sets: SessionSet[]
  exercises: Exercise[]
}) {
  const intensities = useMemo(
    () => computeIntensities(sets, exercises),
    [sets, exercises],
  )

  const fill = (id: string) => {
    const v = intensities[id] ?? 0
    if (v <= 0) return 'transparent'
    const op = 0.25 + 0.75 * v
    return `rgba(220, 38, 38, ${op})`
  }

  const skin = 'var(--color-secondary)'
  const stroke = 'var(--color-border)'

  // Lista de músculos trabalhados pra mostrar legenda embaixo
  const worked = Object.entries(intensities)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <BodyFront fill={fill} skin={skin} stroke={stroke} />
        <BodyBack fill={fill} skin={skin} stroke={stroke} />
      </div>
      {worked.length === 0 ? (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Nenhuma série completada — boneco sem ativação.
        </p>
      ) : null}
    </div>
  )
}

function BodyFront({
  fill,
  skin,
  stroke,
}: {
  fill: (id: string) => string
  skin: string
  stroke: string
}) {
  return (
    <div>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        Frente
      </p>
      <svg
        viewBox="0 0 200 440"
        className="mx-auto h-64 w-auto"
        aria-label="Vista frontal dos músculos trabalhados"
      >
        {/* Cabeça */}
        <ellipse
          cx="100"
          cy="40"
          rx="22"
          ry="26"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Pescoço */}
        <rect
          x="91"
          y="62"
          width="18"
          height="14"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Tronco silhueta */}
        <path
          d="M 60 86 Q 70 78 100 78 Q 130 78 140 86 L 144 220 L 56 220 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Braço base — esquerdo */}
        <path
          d="M 50 92 L 36 100 L 32 200 L 24 240 L 32 245 L 42 220 L 48 105 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Braço base — direito */}
        <path
          d="M 150 92 L 164 100 L 168 200 L 176 240 L 168 245 L 158 220 L 152 105 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Quadril */}
        <path
          d="M 56 220 L 144 220 L 140 248 L 60 248 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Pernas base */}
        <path
          d="M 60 248 L 96 248 L 96 408 L 80 414 L 64 408 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        <path
          d="M 104 248 L 140 248 L 136 408 L 120 414 L 104 408 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />

        {/* ===== Músculos pintáveis (frente) ===== */}
        {/* Trapézio */}
        <path
          d="M 78 80 Q 100 73 122 80 L 118 92 L 82 92 Z"
          fill={fill('traps')}
        />
        {/* Ombros */}
        <ellipse cx="60" cy="100" rx="12" ry="14" fill={fill('shoulders')} />
        <ellipse cx="140" cy="100" rx="12" ry="14" fill={fill('shoulders')} />
        {/* Peito */}
        <ellipse cx="82" cy="115" rx="20" ry="16" fill={fill('chest')} />
        <ellipse cx="118" cy="115" rx="20" ry="16" fill={fill('chest')} />
        {/* Bíceps */}
        <ellipse cx="42" cy="135" rx="8" ry="22" fill={fill('biceps')} />
        <ellipse cx="158" cy="135" rx="8" ry="22" fill={fill('biceps')} />
        {/* Antebraços */}
        <ellipse cx="32" cy="190" rx="8" ry="24" fill={fill('forearms')} />
        <ellipse cx="168" cy="190" rx="8" ry="24" fill={fill('forearms')} />
        {/* Abdômen */}
        <rect
          x="86"
          y="145"
          width="28"
          height="68"
          rx="6"
          fill={fill('abs')}
        />
        {/* Quadríceps */}
        <ellipse cx="80" cy="295" rx="16" ry="48" fill={fill('quads')} />
        <ellipse cx="120" cy="295" rx="16" ry="48" fill={fill('quads')} />
        {/* Panturrilhas (vista lateral parcial) */}
        <ellipse cx="80" cy="378" rx="12" ry="22" fill={fill('calves')} />
        <ellipse cx="120" cy="378" rx="12" ry="22" fill={fill('calves')} />
      </svg>
    </div>
  )
}

function BodyBack({
  fill,
  skin,
  stroke,
}: {
  fill: (id: string) => string
  skin: string
  stroke: string
}) {
  return (
    <div>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        Costas
      </p>
      <svg
        viewBox="0 0 200 440"
        className="mx-auto h-64 w-auto"
        aria-label="Vista posterior dos músculos trabalhados"
      >
        {/* Cabeça */}
        <ellipse
          cx="100"
          cy="40"
          rx="22"
          ry="26"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Pescoço */}
        <rect
          x="91"
          y="62"
          width="18"
          height="14"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Tronco silhueta */}
        <path
          d="M 60 86 Q 70 78 100 78 Q 130 78 140 86 L 144 220 L 56 220 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Braços base */}
        <path
          d="M 50 92 L 36 100 L 32 200 L 24 240 L 32 245 L 42 220 L 48 105 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        <path
          d="M 150 92 L 164 100 L 168 200 L 176 240 L 168 245 L 158 220 L 152 105 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Quadril */}
        <path
          d="M 56 220 L 144 220 L 140 248 L 60 248 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Pernas base */}
        <path
          d="M 60 248 L 96 248 L 96 408 L 80 414 L 64 408 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />
        <path
          d="M 104 248 L 140 248 L 136 408 L 120 414 L 104 408 Z"
          fill={skin}
          stroke={stroke}
          strokeWidth="1.5"
        />

        {/* ===== Músculos pintáveis (costas) ===== */}
        {/* Trapézio (mais alto/ amplo nas costas) */}
        <path
          d="M 76 80 Q 100 72 124 80 L 130 110 Q 100 102 70 110 Z"
          fill={fill('traps')}
        />
        {/* Ombros (rear delts) */}
        <ellipse cx="60" cy="100" rx="12" ry="14" fill={fill('shoulders')} />
        <ellipse cx="140" cy="100" rx="12" ry="14" fill={fill('shoulders')} />
        {/* Costas (lats + meio das costas) */}
        <path
          d="M 70 110 Q 100 118 130 110 L 138 200 Q 100 210 62 200 Z"
          fill={fill('back')}
        />
        {/* Tríceps */}
        <ellipse cx="42" cy="135" rx="8" ry="22" fill={fill('triceps')} />
        <ellipse cx="158" cy="135" rx="8" ry="22" fill={fill('triceps')} />
        {/* Antebraços */}
        <ellipse cx="32" cy="190" rx="8" ry="24" fill={fill('forearms')} />
        <ellipse cx="168" cy="190" rx="8" ry="24" fill={fill('forearms')} />
        {/* Glúteos */}
        <ellipse cx="80" cy="240" rx="16" ry="20" fill={fill('glutes')} />
        <ellipse cx="120" cy="240" rx="16" ry="20" fill={fill('glutes')} />
        {/* Posteriores (hamstrings) */}
        <ellipse cx="80" cy="305" rx="14" ry="42" fill={fill('hamstrings')} />
        <ellipse cx="120" cy="305" rx="14" ry="42" fill={fill('hamstrings')} />
        {/* Panturrilhas (vista posterior — mais cheia) */}
        <ellipse cx="80" cy="378" rx="13" ry="26" fill={fill('calves')} />
        <ellipse cx="120" cy="378" rx="13" ry="26" fill={fill('calves')} />
      </svg>
    </div>
  )
}

function computeIntensities(
  sets: SessionSet[],
  exercises: Exercise[],
): Record<string, number> {
  const exById = new Map(exercises.map((e) => [e.id, e]))
  const counts = new Map<string, number>()

  for (const set of sets) {
    if (!set.completed) continue
    const ex = exById.get(set.exerciseId)
    if (!ex) continue
    counts.set(
      ex.primaryMuscleId,
      (counts.get(ex.primaryMuscleId) ?? 0) + 1,
    )
    for (const m of ex.secondaryMuscles) {
      counts.set(m, (counts.get(m) ?? 0) + 0.5)
    }
  }

  if (counts.size === 0) return {}

  // Normaliza pelo máximo (mais trabalhado = 1.0)
  const max = Math.max(...counts.values())
  const result: Record<string, number> = {}
  for (const [id, c] of counts) result[id] = c / max
  return result
}
