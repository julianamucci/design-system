/**
 * Snippet do painel Code do tempo da resposta — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet. O sufixo `Source` fecha cada nome porque é por ele
 * que a guarda transversal reconhece um construtor de snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que as medidas chegam
 * ESCRITAS, e que quantas delas existem é de quem mediu. As duas juntas são o
 * contrato — quem copiasse só a marcação dividiria token por segundo na
 * primeira vez que precisasse da velocidade, e um dia mostraria `38.4` numa
 * página em que o separador decimal é a vírgula.
 *
 * Por isso o formatador aparece no snippet, com idioma explícito: é ele que o
 * leitor precisa reconhecer como SEU, e não do design system. E é por isso que
 * NENHUM snippet daqui importa conta compartilhada — não há nenhuma para
 * importar, e um snippet que fingisse uma ensinaria uma dependência que a peça
 * não tem.
 */
import { attrsMultilinha, jsxSnippet, type SourceTransform } from '@/lib/story-source';

export type MessageTimingSnippetOptions = {
  /** Quantas das quatro medidas chegaram. */
  measures?: number;
  /** A medição ainda está andando? */
  streaming?: boolean;
};

const IMPORT_TIMING = 'import { MessageTiming } from "@/components/ui/message-timing";';

/** As quatro medidas do exemplo, já escritas, na ordem de quem mediu. */
const WRITTEN_MEASURES: readonly string[] = [
  '{ label: "Primeiro token", value: written(420, "millisecond") },',
  '{ label: "Total", value: written(1.24, "second") },',
  '{ label: "Velocidade", value: "38,4 tok/s" },',
  '{ label: "Pedaços", value: "42" },',
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
    'const written = (value, unit) =>',
    '  new Intl.NumberFormat("pt-BR", {',
    '    style: "unit",',
    '    unit,',
    '    unitDisplay: "short",',
    '    maximumFractionDigits: 2,',
    '  }).format(value);',
  ].join('\n');
}

/** A lista de medidas do exemplo, cortada em quantas o caso conhece. */
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

/** Todas as listas do exemplo, sem corte — os snippets de composição as usam. */
function everyMeasureLines(): string {
  return ['const measured = [', ...WRITTEN_MEASURES.map((line) => `  ${line}`), '];'].join('\n');
}

function build(opts: MessageTimingSnippetOptions): string {
  const measures = opts.measures ?? 4;
  const streaming = opts.streaming ?? false;

  // `streaming` só entra quando é `true`: passar o padrão explícito ensinaria
  // que ele precisa ser passado, e a medição encerrada é o caso comum.
  const markup = `<MessageTiming${attrsMultilinha([
    'stats={measured}',
    streaming ? 'streaming' : undefined,
    'labels={rotulos}',
  ])} />`;

  const blocks = [
    measures > 0 ? writerLines() : undefined,
    measureLines(measures),
    streaming
      ? [
        '// A MEDIÇÃO AINDA ANDA: a peça avisa que aquilo está mudando e abre a',
        '// linha com a palavra do estado. Nada disso é cor, e nada se anuncia.',
      ].join('\n')
      : undefined,
    markup,
  ].filter((block): block is string => typeof block === 'string');

  return jsxSnippet(IMPORT_TIMING, blocks.join('\n\n'));
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
 * É o caso comum, e é ele que mostra por que a etiqueta do estado não aparece
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
 * snippet mostra o caso porque ele é a borda: quem só testar com dado cheio
 * nunca descobre o que a peça faz sem dado nenhum.
 */
export function messageTimingEmptySource(): string {
  return build({ measures: 0 });
}

/**
 * Os quatro casos, percorridos de uma vez.
 *
 * O laço é o assunto: a MESMA marcação atende os quatro, e o que muda é quantas
 * medidas chegaram e se a medição acabou.
 */
export function messageTimingEveryCaseSource(): string {
  return jsxSnippet(
    IMPORT_TIMING,
    [
      writerLines(),
      '',
      everyMeasureLines(),
      '',
      '// A peça não reserva espaço para o que não veio, e não reordena o que veio.',
      '[4, 3, 2, 0].map((count) => (',
      '  <MessageTiming',
      '    key={count}',
      '    stats={measured.slice(0, count)}',
      '    labels={rotulos}',
      '  />',
      '))',
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
  return jsxSnippet(
    IMPORT_TIMING,
    [
      writerLines(),
      '',
      everyMeasureLines(),
      '',
      '// A FORMA É DO CONTAINER. Estreito, a linha cai em um par por linha; largo,',
      '// ela fica em uma linha só. Não há prop de forma, e não precisa haver.',
      '<div className="nds-max-w-3xs">',
      '  <MessageTiming stats={measured} labels={rotulos} />',
      '</div>',
    ].join('\n'),
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
  return jsxSnippet(
    [
      IMPORT_TIMING,
      'import { Button } from "@/components/ui/button";',
      'import {',
      '  Tooltip,',
      '  TooltipContent,',
      '  TooltipProvider,',
      '  TooltipTrigger,',
      '} from "@/components/ui/tooltip";',
    ].join('\n'),
    [
      writerLines(),
      '',
      everyMeasureLines(),
      '',
      '// O GATILHO É DE QUEM CONSOME, e tem nome próprio: em toque não há ponteiro,',
      '// e o controle precisa dizer o que mostra mesmo sem a dica aparecer.',
      '<TooltipProvider delay={0}>',
      '  <Tooltip>',
      '    <TooltipTrigger',
      '      render={(props) => (',
      '        <Button {...props} variant="ghost" size="sm" aria-label="Tempo desta resposta">',
      '          1,24 s',
      '        </Button>',
      '      )}',
      '    />',
      '    <TooltipContent side="top">',
      '      <MessageTiming stats={measured} labels={rotulos} />',
      '    </TooltipContent>',
      '  </Tooltip>',
      '</TooltipProvider>',
    ].join('\n'),
  );
}
