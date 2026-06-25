/**
 * Mensagens motivacionais cômicas pra exibir no fim de um treino.
 * Combo: PRAISE (título) + CLOSER (subtítulo).
 * Escolhidas de forma estável pelo id da sessão (mesma sessão → mesma combo).
 */

export const PRAISES: string[] = [
  'Bora monstrão, mais 1%.',
  'Saiu da academia que nem o Hulk com sono.',
  'Treinão. Pode pedir o açaí.',
  'Hoje o ferro pediu pelo amor de Deus.',
  'Hoje fez o Schwarzenegger chorar de inveja.',
  'O whey agradece os serviços prestados.',
  'Tá saindo do casulo, marombinha.',
  'O espelho da academia te ama hoje.',
  'Treinou que nem o pai mandou.',
  'Saiu igual leão. Voltou cantando que nem passarinho.',
  'A barra tá pedindo pelos pais.',
  'Tô orgulhoso. Vai pra cama logo.',
  'Já pode postar foto no story (sem flexionar, ok).',
  'Treinou tipo Deus tivesse te vendo. (E tava.)',
  'Hoje tu colocou o gym contra a parede.',
  'Reza pra cama te aguentar.',
  'Bora postar "just did it".',
  'Mais um pro currículo de monstrão.',
  'Quem te viu, quem te vê.',
  'Tu mandou o gym pra terapia.',
  'O treino chorou hoje.',
  'Acabou o treino. Acabou o orgulho do gym também.',
  'Já avisou o mercado pra dobrar o estoque de ovo?',
]

export const CLOSERS: string[] = [
  '+1% de marrentice.',
  'Level monstrão +1.',
  'Volta amanhã sem desculpa.',
  'O whey tá ansioso aí.',
  'Mais um nível desbloqueado.',
  'Próximo nível: monstrão brabo.',
  'Mãe orgulhosa, +1 dia.',
  'Cilada, mas valeu.',
  'Hoje o ferro não respeitou ninguém.',
  'Já pode posar no espelho.',
  'Açaí 500ml liberado oficialmente.',
  'Netflix pode te receber agora.',
  'Vai descansar, marromba.',
  'Foto pro story na luz boa.',
  'Adesivou o gym hoje.',
  '+1 ponto pra Grifinória da maromba.',
  'O ferro pediu RH agora pouco.',
  'Próxima parada: cama.',
  'Hoje pegou pesado, em? Lá ele.',
  'Aguentou até o final sem soltar? Lá ele.',
  'Foi com tudo na hora do empurrão? Lá ele.',
  'Subiu e desceu várias vezes hoje. Lá ele.',
  'Tava bem firme na pegada, hein. Lá ele.',
  'Foi de repetição lenta, com calma? Lá ele.',
  'Hoje deu uma boa suada com o parceiro. Lá ele.',
]

/**
 * Frango: quando o volume total (kg movidos) foi MENOR que a última vez nesse
 * mesmo treino. Tom cômico de "pegou leve hoje" — unissex, sem falar de
 * magreza/gordura, só zoeira sobre a carga do dia.
 */
export const FRANGO_PRAISES: string[] = [
  'Frangou hoje, hein.',
  'Treinou fofo, mestre.',
  'O ferro hoje nem te sentiu.',
  'Pegou leve igual pluma.',
  'Hoje o haltere descansou contigo.',
  'Treino modo soninho ativado.',
  'A barra perguntou se tu tava bem.',
  'Modo econômico de energia, né.',
  'Treino tamanho família, porção kids.',
  'Hoje foi mais alongamento que treino.',
  'Veio passear na academia hoje?',
  'Hoje o peso ganhou de você.',
  'Foi de boa demais, marombinha.',
  'Treino diet: zero açúcar, zero peso.',
  'Hoje tu cochilou no meio do treino, confessa.',
]

export const FRANGO_CLOSERS: string[] = [
  'Amanhã volta com sede de monstro.',
  'Foi mal pro ferro. Recupera amanhã.',
  'Todo mundo tem dia de pluma. Bola pra frente.',
  'Da próxima pega mais pesado, vai.',
  'O whey ainda acredita em você.',
  'Frango também é proteína. Bora subir.',
  'Foi leve, mas foi. Conta como presença.',
  'Amanhã o ferro cobra os juros.',
  'Descanso ativo, vamos chamar assim.',
  'Menos que da última vez, hein. Sem vacilo amanhã.',
  'O gym anotou. Capricha no próximo.',
  'Hoje foi de leve. Amanhã é tu e a barra.',
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

/** Combo: praise (título) + closer (subtítulo). Estável pelo seed.
 *  `regressed`: true quando o volume foi MENOR que a última vez nesse treino —
 *  aí entram as frases de frango. Volume igual ou maior → mensagens padrão. */
export function pickWorkoutEndMessage(
  seed: string,
  regressed = false,
): {
  praise: string
  closer: string
} {
  if (regressed) {
    return {
      praise: pickStable(FRANGO_PRAISES, seed),
      closer: pickStable(FRANGO_CLOSERS, seed + ':closer'),
    }
  }
  return {
    praise: pickStable(PRAISES, seed),
    closer: pickStable(CLOSERS, seed + ':closer'),
  }
}
