/**
 * Mensagens motivacionais e variações de "X% menos frango".
 * Usadas nas telas de finalização de treino e detalhe de sessão pra
 * dar uma cobrança levinha + recompensa simbólica.
 *
 * `pickByDate` retorna uma escolha estável-no-dia (varia entre dias mas
 * é a mesma pro mesmo dia/usuário). `pickRandom` puxa qualquer uma.
 */

export const PRAISES: string[] = [
  'Treino monstro, em! 💪',
  'Tu é fera, mandou bem demais!',
  'Bombou demais hoje!',
  'Que treinão sensacional!',
  'Garras de fora, hein!',
  'Treino brabo, finalizado.',
  'Vai quebrando a barra, leão!',
  'Saiu com tudo dessa hoje.',
  'Top demais, segue assim.',
  'Performance digna de capa de revista.',
  'Tirou onda no treino hoje.',
  'Treino fechado com chave de ouro.',
  'Mandou ver, sem moleza.',
  'Cada série, um passo a mais.',
  'Suor bem investido, parabéns.',
  'Tu não tava de brincadeira hoje.',
  'Que disciplina, irmão.',
  'Foco total. Resultado vindo.',
]

export const FRANGO_LINES: string[] = [
  '1% menos frango.',
  '1% mais shape.',
  '1% mais marrento.',
  '1% mais leão da serra.',
  '1% menos magrelo.',
  '1% mais gigante.',
  '1% mais GMI ativado.',
  '1% mais pump.',
  '1% mais máquina.',
  '1% mais firme.',
  '1% mais musculoso.',
  '1% menos peninha.',
  '1% mais hipertrofia.',
  '1% mais cresceu.',
  'Frangômetro caiu mais 1%.',
  'Genetic limits getting unlocked.',
]

function hashString(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  }
  return h
}

/** Retorna uma escolha estável pro mesmo `seed` (ex: id da sessão). */
export function pickStable<T>(arr: T[], seed: string): T {
  const idx = hashString(seed) % arr.length
  return arr[idx]
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Combo: praise + frango line, escolhido de forma estável pelo seed (ex: session id). */
export function pickWorkoutEndMessage(seed: string): {
  praise: string
  frango: string
} {
  return {
    praise: pickStable(PRAISES, seed),
    frango: pickStable(FRANGO_LINES, seed + ':frango'),
  }
}
