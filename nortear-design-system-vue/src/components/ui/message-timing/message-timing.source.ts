/**
 * Transforms do painel Code do tempo da resposta.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que as medidas chegam
 * ESCRITAS, e que quantas delas existem é de quem mediu. As duas juntas são o
 * contrato — quem copiasse só a tag dividiria token por segundo na primeira vez
 * que precisasse da velocidade, e um dia mostraria `38.4` numa página em que o
 * separador decimal é a vírgula.
 *
 * Por isso o formatador aparece no snippet, com idioma explícito: é ele que o
 * leitor precisa reconhecer como SEU, e não do design system. E é por isso que
 * NENHUM snippet daqui importa conta compartilhada — não há nenhuma para
 * importar, e um snippet que fingisse uma ensinaria uma dependência que a peça
 * não tem.
 */
import { attrsMultilinha, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type MessageTimingSnippetOptions = {
  /** Quantas das quatro medidas chegaram. */
  measures?: number;
  /** A medição ainda está andando? */
  streaming?: boolean;
};

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { MessageTiming } from '@/components/ui/message-timing';";

/**
 * Os rótulos que o exemplo DECLARA.
 *
 * `:labels="rotulos"` nomeia texto de interface, que é de quem consome — e o
 * exemplo não o declarava em lugar nenhum: quem copiasse recebia um `labels`
 * indefinido, e é ele que nomeia cada medida a quem lê o número sozinho.
 */
const ROTULOS = [
  'const rotulos = {',
  "  title: 'Tempo desta resposta',",
  "  measuring: 'Medindo',",
  "  speedUnit: 'tok/s',",
  "  stats: { firstToken: 'Primeiro token', total: 'Total', speed: 'Velocidade', chunks: 'Pedaços' },",
  '};',
].join('\n');

const IMPORT_TOOLTIP = [
  IMPORT,
  "import { Button } from '@/components/ui/button';",
  'import {',
  '  Tooltip,',
  '  TooltipContent,',
  '  TooltipProvider,',
  '  TooltipTrigger,',
  "} from '@/components/ui/tooltip';",
].join('\n');

/** As quatro medidas do exemplo, já escritas, na ordem de quem mediu. */
const WRITTEN_MEASURES: readonly string[] = [
  "{ label: 'Primeiro token', value: written(420, 'millisecond') },",
  "{ label: 'Total', value: written(1.24, 'second') },",
  "{ label: 'Velocidade', value: '38,4 tok/s' },",
  "{ label: 'Pedaços', value: '42' },",
];

/**
 * O formatador que é de QUEM MEDE, e nunca do componente.
 *
 * A UNIDADE é parâmetro, e não um limiar dentro da função: quem cronometrou já
 * sabe se a medida se lê em milissegundos ou em segundos, e uma regra escrita
 * aqui seria uma regra a mais para cinco stacks discordarem sobre.
 */
function writerLines(): string {
  return [
    '// TUDO CHEGA ESCRITO. Separador decimal, abreviatura de unidade e ordem das',
    '// partes são decisão de idioma E de lugar, e quem as conhece é quem mediu.',
    'const written = (value: number, unit: string) =>',
    "  new Intl.NumberFormat('pt-BR', {",
    "    style: 'unit',",
    '    unit,',
    "    unitDisplay: 'short',",
    '    maximumFractionDigits: 2,',
    '  }).format(value);',
  ].join('\n');
}

/** A lista de medidas do exemplo, cortada em quantas o exemplo conhece. */
function measureLines(measures: number): string {
  const taken = WRITTEN_MEASURES.slice(0, measures);
  if (taken.length === 0) {
    return [
      '// SEM MEDIDA NENHUMA a lista não é montada, e quem não mediu nada não',
      '// monta a peça: uma lista vazia deixaria um espaço que ninguém pediu.',
      'const measured = [];',
    ].join('\n');
  }
  return [
    '// QUANTAS MEDIDAS EXISTEM É DE QUEM MEDE. A peça desenha quantas vierem, na',
    '// ordem em que vierem, e não reserva espaço para o que não veio.',
    'const measured = [',
    ...taken.map((line) => `  ${line}`),
    '];',
  ].join('\n');
}

/** A tag da linha, com a lista e o estado que o exemplo tiver. */
function timingTag(stats: string, streaming = false): string {
  return `<MessageTiming${attrsMultilinha([
    `:stats="${stats}"`,
    // `streaming` só entra quando é `true`: passar o padrão explícito ensinaria
    // que ele precisa ser passado, e a medição encerrada é o comum.
    streaming ? ':streaming="true"' : '',
    ':labels="rotulos"',
  ])} />`;
}

function build(opts: MessageTimingSnippetOptions): string {
  const measures = opts.measures ?? 4;
  const streaming = opts.streaming ?? false;

  const script = [
    IMPORT,
    '',
    ROTULOS,
    '',
    measures > 0 ? `${writerLines()}\n` : '',
    measureLines(measures),
  ]
    .filter((part) => part !== '')
    .join('\n');

  const template = streaming
    ? [
      '<!-- A MEDIÇÃO AINDA ANDA: a peça avisa que aquilo está mudando e abre a',
      '     linha com a palavra do estado. Nada disso é cor, e nada se anuncia. -->',
      timingTag('measured', true),
    ].join('\n')
    : timingTag('measured');

  return vueSnippet(script, template);
}

/** Transform do `meta` — o Playground, que escreve as medidas por extenso. */
export const messageTimingSource: SourceTransform<MessageTimingSnippetOptions> = (
  _generated,
  ctx,
) => {
  const args = ctx?.args ?? {};
  return build({ measures: args.measures, streaming: args.streaming });
};

/**
 * A medição encerrada: as quatro medidas, e nenhuma ressalva.
 *
 * É o comum, e é ele que mostra por que a etiqueta do estado não aparece
 * sempre: uma linha de números sem ressalva já se lê como o que ela é.
 */
export function messageTimingSettledSource(): string {
  return build({ measures: 4 });
}

/**
 * A medição ainda em andamento.
 *
 * O snippet ensina que o aviso é um SINALIZADOR, e não um texto: a palavra do
 * estado vem dos rótulos, porque é interface e tem três traduções.
 */
export function messageTimingMeasuringSource(): string {
  return build({ measures: 3, streaming: true });
}

/** Só parte das medidas — e a linha continua honesta com duas. */
export function messageTimingPartialSource(): string {
  return build({ measures: 2 });
}

/**
 * Nenhuma medida.
 *
 * A lista não é montada, e o nome da medição segue sendo o único conteúdo. O
 * snippet mostra a borda porque quem só testar com dado cheio nunca descobre o
 * que a peça faz sem dado nenhum.
 */
export function messageTimingEmptySource(): string {
  return build({ measures: 0 });
}

/**
 * As quatro contagens, percorridas de uma vez.
 *
 * O laço é o assunto: a MESMA tag atende as quatro, e o que muda é quantas
 * medidas chegaram e se a medição acabou.
 */
export function messageTimingEveryCaseSource(): string {
  return vueSnippet(
    [
      IMPORT,
      '',
      ROTULOS,
      '',
      writerLines(),
      '',
      'const measured = [',
      ...WRITTEN_MEASURES.map((line) => `  ${line}`),
      '];',
    ].join('\n'),
    [
      '<!-- A peça não reserva espaço para o que não veio, e não reordena o que veio. -->',
      '<MessageTiming',
      '  v-for="quantidade in [4, 3, 2, 0]"',
      '  :key="quantidade"',
      '  :stats="measured.slice(0, quantidade)"',
      '  :labels="rotulos"',
      '/>',
    ].join('\n'),
  );
}

/**
 * A linha num espaço estreito.
 *
 * O snippet ensina que NÃO HÁ ARGUMENTO DE FORMA: a peça ocupa a largura que
 * tem e quebra sozinha, um par por linha, porque o par é a unidade que quebra.
 * Quem procurasse uma prop de layout não a encontraria, e é isso que o exemplo
 * responde.
 */
export function messageTimingInTightSpaceSource(): string {
  const body = [
    '<!-- A FORMA É DO CONTAINER. Estreito, a linha cai em um par por linha;',
    '     largo, ela fica em uma linha só. Não há prop de forma, e não precisa. -->',
    timingTag('measured'),
  ].join('\n');

  return vueSnippet(
    [
      IMPORT,
      '',
      ROTULOS,
      '',
      writerLines(),
      '',
      'const measured = [',
      ...WRITTEN_MEASURES.map((line) => `  ${line}`),
      '];',
    ].join('\n'),
    `<div class="nds-max-w-3xs">\n${indentar(body)}\n</div>`,
  );
}

/**
 * A forma compacta da fonte, montada como COMPOSIÇÃO.
 *
 * O gatilho é um controle de verdade, com nome próprio, e a linha inteira mora
 * dentro da dica. A peça não abre camada flutuante nem herda a política de foco
 * que vem com ela — §4.2 e decisão 8 da folha.
 */
export function messageTimingInsideTooltipSource(): string {
  const trigger = [
    '<!-- O GATILHO É DE QUEM CONSOME, e tem nome próprio: em toque não há',
    '     ponteiro, e o controle precisa dizer o que mostra sem a dica aparecer. -->',
    '<TooltipTrigger as-child>',
    '  <Button',
    '    variant="ghost"',
    '    size="sm"',
    '    aria-label="Tempo desta resposta"',
    '  >1,24 s</Button>',
    '</TooltipTrigger>',
    '<TooltipContent side="top">',
    indentar(timingTag('measured')),
    '</TooltipContent>',
  ].join('\n');

  const body = [
    '<Tooltip>',
    indentar(trigger),
    '</Tooltip>',
  ].join('\n');

  return vueSnippet(
    [
      IMPORT_TOOLTIP,
      '',
      ROTULOS,
      '',
      writerLines(),
      '',
      'const measured = [',
      ...WRITTEN_MEASURES.map((line) => `  ${line}`),
      '];',
    ].join('\n'),
    `<TooltipProvider :delay-duration="0">\n${indentar(body)}\n</TooltipProvider>`,
  );
}
