export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', namePt: 'Peito' },
  { id: 'back', name: 'Back', namePt: 'Costas' },
  { id: 'quads', name: 'Quads', namePt: 'Quadríceps' },
  { id: 'hamstrings', name: 'Hamstrings', namePt: 'Posteriores' },
  { id: 'glutes', name: 'Glutes', namePt: 'Glúteos' },
  { id: 'calves', name: 'Calves', namePt: 'Panturrilhas' },
  { id: 'shoulders', name: 'Shoulders', namePt: 'Ombros' },
  { id: 'biceps', name: 'Biceps', namePt: 'Bíceps' },
  { id: 'triceps', name: 'Triceps', namePt: 'Tríceps' },
  { id: 'abs', name: 'Abs', namePt: 'Abdômen' },
  { id: 'traps', name: 'Traps', namePt: 'Trapézio' },
  { id: 'forearms', name: 'Forearms', namePt: 'Antebraços' },
] as const

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'bands'

export interface SeedExercise {
  id: string
  name: string
  primaryMuscle: string
  secondaryMuscles: string[]
  equipment: Equipment
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string
}

export const EXERCISES: SeedExercise[] = [
  // Peito
  { id: 'ex-bench-press', name: 'Supino reto com barra', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Deite no banco, pés firmes no chão. Pegue a barra com pegada um pouco mais aberta que os ombros. Desça controlado até o peito, expire e empurre de volta.' },
  { id: 'ex-incline-db-press', name: 'Supino inclinado com halteres', primaryMuscle: 'chest', secondaryMuscles: ['shoulders', 'triceps'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Banco a 30–45°. Halteres na altura do peito, palmas viradas para frente. Empurre para cima sem trancar os cotovelos.' },
  { id: 'ex-db-fly', name: 'Crucifixo com halteres', primaryMuscle: 'chest', secondaryMuscles: ['shoulders'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Banco reto, cotovelos levemente flexionados. Abra os braços em arco até alongar o peito, contraia e volte.' },
  { id: 'ex-pec-deck', name: 'Peck deck', primaryMuscle: 'chest', secondaryMuscles: [], equipment: 'machine', difficulty: 'beginner', instructions: 'Costas apoiadas, antebraços nas almofadas. Junte os braços contraindo o peito, controle a volta.' },
  { id: 'ex-pushup', name: 'Flexão de braço', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders', 'abs'], equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Mãos um pouco mais abertas que os ombros, corpo reto da cabeça aos pés. Desça até o peito quase tocar o chão e suba.' },
  { id: 'ex-dips', name: 'Mergulho em paralelas', primaryMuscle: 'chest', secondaryMuscles: ['triceps', 'shoulders'], equipment: 'bodyweight', difficulty: 'advanced', instructions: 'Apoie nas paralelas, incline o tronco à frente para focar peito. Desça até cotovelos a 90° e empurre de volta.' },
  { id: 'ex-cable-crossover', name: 'Crossover na polia', primaryMuscle: 'chest', secondaryMuscles: ['shoulders'], equipment: 'cable', difficulty: 'intermediate', instructions: 'Em pé, um passo à frente das polias altas. Traga as mãos cruzando à frente, contraindo o peito.' },

  // Costas
  { id: 'ex-lat-pulldown', name: 'Puxada na frente', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'machine', difficulty: 'beginner', instructions: 'Sentado, pegada aberta na barra. Puxe até a barra encostar perto da clavícula, cotovelos descendo. Volte controlado.' },
  { id: 'ex-bent-over-row', name: 'Remada curvada com barra', primaryMuscle: 'back', secondaryMuscles: ['biceps', 'traps'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Tronco inclinado ~45°, coluna neutra. Puxe a barra em direção ao abdômen aproximando as escápulas.' },
  { id: 'ex-seated-row', name: 'Remada sentada na máquina', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'cable', difficulty: 'beginner', instructions: 'Sentado, pés apoiados, costas retas. Puxe os pegadores até o abdômen, cotovelos rentes ao corpo.' },
  { id: 'ex-pullup', name: 'Barra fixa', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'bodyweight', difficulty: 'advanced', instructions: 'Pegada pronada um pouco mais aberta que os ombros. Puxe até o queixo passar a barra, desça controlado.' },
  { id: 'ex-deadlift', name: 'Levantamento terra', primaryMuscle: 'back', secondaryMuscles: ['glutes', 'hamstrings', 'traps'], equipment: 'barbell', difficulty: 'advanced', instructions: 'Pés na largura do quadril, barra próxima às canelas. Coluna neutra, levante empurrando o chão. Suba até estender quadril.' },
  { id: 'ex-db-row', name: 'Remada unilateral com halter', primaryMuscle: 'back', secondaryMuscles: ['biceps'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Apoie joelho e mão no banco, halter na outra mão. Puxe o halter em direção ao quadril, cotovelo rente ao corpo.' },
  { id: 'ex-pullover', name: 'Pullover', primaryMuscle: 'back', secondaryMuscles: ['chest'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Deitado no banco, halter segurado com as duas mãos acima do peito. Desça atrás da cabeça em arco, retorne.' },
  { id: 'ex-shrug', name: 'Encolhimento com halteres', primaryMuscle: 'traps', secondaryMuscles: [], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Em pé, halteres ao lado do corpo. Eleve os ombros em direção às orelhas, contraia o trapézio, desça controlado.' },

  // Pernas
  { id: 'ex-squat', name: 'Agachamento livre', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Barra apoiada no trapézio, pés na largura dos ombros. Desça empurrando o quadril para trás, joelhos alinhados com os pés. Suba.' },
  { id: 'ex-leg-press', name: 'Leg press 45°', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'machine', difficulty: 'beginner', instructions: 'Pés na largura dos ombros, costas apoiadas. Desça até joelhos a ~90°, empurre sem trancar os joelhos.' },
  { id: 'ex-leg-extension', name: 'Cadeira extensora', primaryMuscle: 'quads', secondaryMuscles: [], equipment: 'machine', difficulty: 'beginner', instructions: 'Sentado, almofada no peito do pé. Estenda os joelhos contraindo o quadríceps no topo, desça controlado.' },
  { id: 'ex-leg-curl', name: 'Mesa flexora', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes'], equipment: 'machine', difficulty: 'beginner', instructions: 'Deitado de bruços, almofada acima dos calcanhares. Flexione os joelhos contraindo posteriores, retorne.' },
  { id: 'ex-stiff', name: 'Stiff com halteres', primaryMuscle: 'hamstrings', secondaryMuscles: ['glutes', 'back'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Em pé, joelhos levemente flexionados. Desça os halteres rentes às pernas até alongar os posteriores. Suba.' },
  { id: 'ex-lunge', name: 'Avanço com halteres', primaryMuscle: 'quads', secondaryMuscles: ['glutes', 'hamstrings'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Halteres ao lado do corpo. Dê um passo grande à frente e desça até o joelho de trás quase tocar o chão. Volte.' },
  { id: 'ex-bulgarian', name: 'Búlgaro', primaryMuscle: 'quads', secondaryMuscles: ['glutes'], equipment: 'dumbbell', difficulty: 'advanced', instructions: 'Pé de trás apoiado num banco. Desça até o joelho da frente formar 90°, suba pelo calcanhar da frente.' },
  { id: 'ex-hip-thrust', name: 'Hip thrust', primaryMuscle: 'glutes', secondaryMuscles: ['hamstrings'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Costas apoiadas no banco, barra sobre o quadril (use almofada). Empurre o quadril para cima até alinhar com o tronco.' },
  { id: 'ex-calf-standing', name: 'Panturrilha em pé', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'machine', difficulty: 'beginner', instructions: 'Pés na plataforma, calcanhares para fora. Suba na ponta dos pés contraindo a panturrilha, desça alongando.' },
  { id: 'ex-calf-seated', name: 'Panturrilha sentado', primaryMuscle: 'calves', secondaryMuscles: [], equipment: 'machine', difficulty: 'beginner', instructions: 'Sentado, joelhos a 90°, almofada sobre os joelhos. Eleve os calcanhares, contraia, desça lentamente.' },

  // Ombros
  { id: 'ex-overhead-press', name: 'Desenvolvimento militar', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Em pé, barra na altura do peito. Empurre acima da cabeça, atravessando a linha da cabeça. Volte controlado.' },
  { id: 'ex-db-shoulder-press', name: 'Desenvolvimento com halteres', primaryMuscle: 'shoulders', secondaryMuscles: ['triceps'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Sentado, halteres na altura das orelhas. Empurre para cima até quase trancar, desça em arco.' },
  { id: 'ex-lateral-raise', name: 'Elevação lateral', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Em pé, halteres ao lado. Eleve os braços lateralmente até a altura dos ombros, polegares ligeiramente para baixo.' },
  { id: 'ex-front-raise', name: 'Elevação frontal', primaryMuscle: 'shoulders', secondaryMuscles: [], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Halteres à frente das coxas. Eleve com braços estendidos até a altura dos ombros, alterne os braços ou junte.' },
  { id: 'ex-rear-delt-fly', name: 'Crucifixo invertido', primaryMuscle: 'shoulders', secondaryMuscles: ['back'], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Tronco inclinado à frente, halteres pendurados. Abra os braços em arco contraindo a parte de trás dos ombros.' },
  { id: 'ex-face-pull', name: 'Face pull', primaryMuscle: 'shoulders', secondaryMuscles: ['back', 'traps'], equipment: 'cable', difficulty: 'intermediate', instructions: 'Polia alta com corda. Puxe a corda em direção ao rosto, abrindo os cotovelos para fora.' },

  // Bíceps
  { id: 'ex-barbell-curl', name: 'Rosca direta com barra', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'barbell', difficulty: 'beginner', instructions: 'Em pé, pegada supinada na largura dos ombros. Flexione os cotovelos sem balançar o corpo, contraia o bíceps.' },
  { id: 'ex-db-curl', name: 'Rosca alternada com halteres', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Halteres ao lado, palmas para frente. Flexione um braço por vez, supinando no movimento. Volte controlado.' },
  { id: 'ex-hammer-curl', name: 'Rosca martelo', primaryMuscle: 'biceps', secondaryMuscles: ['forearms'], equipment: 'dumbbell', difficulty: 'beginner', instructions: 'Halteres com pegada neutra (palmas viradas uma pra outra). Flexione os cotovelos mantendo a pegada.' },
  { id: 'ex-preacher', name: 'Rosca scott', primaryMuscle: 'biceps', secondaryMuscles: [], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Banco scott, braços apoiados. Flexione os cotovelos sem despregar os tríceps do banco. Volte sem estender totalmente.' },

  // Tríceps
  { id: 'ex-tri-pushdown', name: 'Tríceps na polia (corda)', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'cable', difficulty: 'beginner', instructions: 'Polia alta com corda. Cotovelos rentes ao corpo, estenda os antebraços para baixo abrindo as mãos no fim.' },
  { id: 'ex-tri-skullcrusher', name: 'Tríceps testa', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Deitado, barra W na altura dos braços. Flexione apenas os cotovelos, descendo a barra à testa. Estenda.' },
  { id: 'ex-tri-french', name: 'Tríceps francês', primaryMuscle: 'triceps', secondaryMuscles: [], equipment: 'dumbbell', difficulty: 'intermediate', instructions: 'Halter segurado com as duas mãos atrás da cabeça. Estenda os cotovelos sem mover os ombros.' },
  { id: 'ex-bench-dip', name: 'Mergulho no banco', primaryMuscle: 'triceps', secondaryMuscles: ['chest', 'shoulders'], equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Mãos no banco atrás do corpo, pernas estendidas. Desça flexionando os cotovelos a 90°, empurre.' },
  { id: 'ex-close-grip-bench', name: 'Supino fechado', primaryMuscle: 'triceps', secondaryMuscles: ['chest', 'shoulders'], equipment: 'barbell', difficulty: 'intermediate', instructions: 'Pegada na largura dos ombros, cotovelos rentes ao corpo. Desça controlado e empurre.' },

  // Abdômen
  { id: 'ex-crunch', name: 'Abdominal supra', primaryMuscle: 'abs', secondaryMuscles: [], equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Deitado, joelhos flexionados. Eleve o tronco contraindo o abdômen sem puxar o pescoço, desça controlado.' },
  { id: 'ex-leg-raise', name: 'Elevação de pernas', primaryMuscle: 'abs', secondaryMuscles: [], equipment: 'bodyweight', difficulty: 'intermediate', instructions: 'Deitado, mãos ao lado do corpo. Eleve as pernas estendidas até 90°, desça controlado sem encostar no chão.' },
  { id: 'ex-plank', name: 'Prancha', primaryMuscle: 'abs', secondaryMuscles: ['shoulders', 'glutes'], equipment: 'bodyweight', difficulty: 'beginner', instructions: 'Antebraços e ponta dos pés no chão, corpo reto. Mantenha a posição contraindo abdômen e glúteos.' },
  { id: 'ex-cable-crunch', name: 'Abdominal na polia', primaryMuscle: 'abs', secondaryMuscles: [], equipment: 'cable', difficulty: 'intermediate', instructions: 'Ajoelhado de frente para a polia alta, corda atrás da cabeça. Flexione o tronco contraindo o abdômen.' },
]
