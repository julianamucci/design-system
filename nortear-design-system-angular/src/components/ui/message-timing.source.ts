/**
 * Transforms do painel Code do tempo da resposta.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos,
 * escreve as medidas e as passa para a peça.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento, e o
 * nome TERMINA em `Source` — é a convenção que `source-snippets.test.ts` cobra
 * nesta stack, e é ela que impede um export de sair da varredura em silêncio.
 * Fábrica curried devolveria função em vez de string, e as checagens que leem o
 * snippet nunca chegariam ao snippet.
 *
 * Cada snippet daqui ensina DUAS coisas, e não uma: que as medidas chegam
 * ESCRITAS, e que quantas delas existem é de quem mediu. As duas juntas são o
 * contrato — quem copiasse só o elemento dividiria token por segundo na primeira
 * vez que precisasse da velocidade, e um dia mostraria `38.4` numa página em que
 * o separador decimal é a vírgula.
 *
 * Por isso o formatador aparece no snippet, com idioma explícito: é ele que o
 * leitor precisa reconhecer como SEU, e não do design system. E é por isso que
 * NENHUM snippet daqui importa conta compartilhada — não há nenhuma para
 * importar, e um snippet que fingisse uma ensinaria uma dependência que a peça
 * não tem.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsMessageTiming } from '@/components/ui/message-timing';";

const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";

const TOOLTIP_IMPORT = "import { NDS_TOOLTIP } from '@/components/ui/tooltip';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type MessageTimingSnippetOptions = {
  /** Quantas das quatro medidas chegaram. */
  measures?: number;
  /** A medição ainda está andando? */
  streaming?: boolean;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type MessageTimingSourceTransform = (
  code: string,
  ctx?: { args?: MessageTimingSnippetOptions },
) => string;

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], used: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    `  imports: [${used.join(', ')}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** As quatro medidas do exemplo, já escritas, na ordem de quem mediu. */
const WRITTEN_MEASURES: readonly string[] = [
  "    { label: 'Primeiro token', value: this.written(420, 'millisecond') },",
  "    { label: 'Total', value: this.written(1.24, 'second') },",
  "    { label: 'Velocidade', value: '38,4 tok/s' },",
  "    { label: 'Pedaços', value: '42' },",
];

/**
 * O formatador que é de QUEM MEDE, e nunca do componente.
 *
 * A UNIDADE é parâmetro, e não um limiar dentro da função: quem cronometrou já
 * sabe se a medida se lê em milissegundos ou em segundos, e uma regra escrita
 * aqui seria uma regra a mais para cinco stacks discordarem sobre.
 */
function writerLines(): string[] {
  return [
    '  // TUDO CHEGA ESCRITO. Separador decimal, abreviatura de unidade e ordem',
    '  // das partes são decisão de idioma E de lugar, e quem as conhece é quem',
    '  // mediu.',
    "  readonly written = (value: number, unit: 'millisecond' | 'second') =>",
    "    new Intl.NumberFormat('pt-BR', {",
    "      style: 'unit',",
    '      unit,',
    "      unitDisplay: 'short',",
    '      maximumFractionDigits: 2,',
    '    }).format(value);',
  ];
}

/** A lista de medidas do exemplo, cortada em quantas o exemplo conhece. */
function measureLines(measures: number): string[] {
  const taken = WRITTEN_MEASURES.slice(0, measures);
  if (taken.length === 0) {
    return [
      '  // SEM MEDIDA NENHUMA a lista não é montada, e quem não mediu nada não',
      '  // monta a peça: uma lista vazia deixaria um espaço que ninguém pediu.',
      '  readonly measured = [];',
    ];
  }
  return [
    '  // QUANTAS MEDIDAS EXISTEM É DE QUEM MEDE. A peça desenha quantas vierem,',
    '  // na ordem em que vierem, e não reserva espaço para o que não veio.',
    '  readonly measured = [',
    ...taken,
    '  ];',
  ];
}

/** O texto da peça: o nome da medição, e a palavra do estado. */
const LABEL_LINES = [
  '  // O texto é de quem monta, e tem três idiomas: a palavra do estado é',
  '  // obrigatória mesmo para quem nunca mostra a peça em movimento.',
  '  readonly labels = {',
  "    title: 'Tempo desta resposta',",
  "    measuring: 'Medindo',",
  '  };',
];

/** A linha sozinha, com as medidas que o exemplo desenha. */
function single(opts: MessageTimingSnippetOptions): string {
  const measures = opts.measures ?? 4;
  const streaming = opts.streaming ?? false;

  return build(
    [IMPORT],
    ['NdsMessageTiming'],
    [
      ...(streaming
        ? [
          '    <!-- A MEDIÇÃO AINDA ANDA: a peça avisa que aquilo está mudando e',
          '         abre a linha com a palavra do estado. Nada disso é cor, e',
          '         nada aqui se anuncia sozinho. -->',
        ]
        : []),
      '    <div',
      '      ndsMessageTiming',
      '      [stats]="measured"',
      // `streaming` só entra quando é `true`: passar o padrão explícito
      // ensinaria que ele precisa ser passado, e a medição encerrada é o comum.
      ...(streaming ? ['      [streaming]="true"'] : []),
      '      [labels]="labels"',
      '    ></div>',
    ],
    [
      ...(measures > 0 ? [...writerLines(), ''] : []),
      ...measureLines(measures),
      '',
      ...LABEL_LINES,
    ],
  );
}

/** Transform do `meta` — o Playground, que escreve as medidas por extenso. */
export const messageTimingSource: MessageTimingSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({ measures: args.measures, streaming: args.streaming });
};

/**
 * A medição encerrada: as quatro medidas, e nenhuma ressalva.
 *
 * É o comum, e é ele que mostra por que a etiqueta do estado não aparece
 * sempre: uma linha de números sem ressalva já se lê como o que ela é.
 */
export function messageTimingSettledSource(): string {
  return single({ measures: 4 });
}

/**
 * A medição ainda em andamento.
 *
 * O snippet ensina que o aviso é um SINALIZADOR, e não um texto: a palavra do
 * estado vem dos rótulos, porque é interface e tem três traduções.
 */
export function messageTimingMeasuringSource(): string {
  return single({ measures: 3, streaming: true });
}

/** Só parte das medidas — e a linha continua honesta com duas. */
export function messageTimingPartialSource(): string {
  return single({ measures: 2 });
}

/**
 * Nenhuma medida.
 *
 * A lista não é montada, e o nome da medição segue sendo o único conteúdo. O
 * snippet mostra a borda porque quem só testar com dado cheio nunca descobre o
 * que a peça faz sem dado nenhum.
 */
export function messageTimingEmptySource(): string {
  return single({ measures: 0 });
}

/**
 * Os quatro exemplos, percorridos de uma vez.
 *
 * O laço é o assunto: a MESMA chamada atende os quatro, e o que muda é quantas
 * medidas chegaram e se a medição acabou.
 */
export function messageTimingEveryCaseSource(): string {
  return build(
    [IMPORT],
    ['NdsMessageTiming'],
    [
      '    <!-- A peça não reserva espaço para o que não veio, e não reordena o',
      '         que veio. -->',
      '    @for (count of counts; track count) {',
      '      <div',
      '        ndsMessageTiming',
      '        [stats]="measured.slice(0, count)"',
      '        [labels]="labels"',
      '      ></div>',
      '    }',
    ],
    [
      ...writerLines(),
      '',
      ...measureLines(4),
      '',
      '  readonly counts = [4, 3, 2, 0];',
      '',
      ...LABEL_LINES,
    ],
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
  return build(
    [IMPORT],
    ['NdsMessageTiming'],
    [
      '    <!-- A FORMA É DO CONTAINER. Estreito, a linha cai em um par por',
      '         linha; largo, ela fica em uma linha só. Não há prop de forma, e',
      '         não precisa haver. -->',
      '    <div class="nds-max-w-3xs">',
      '      <div',
      '        ndsMessageTiming',
      '        [stats]="measured"',
      '        [labels]="labels"',
      '      ></div>',
      '    </div>',
    ],
    [
      ...writerLines(),
      '',
      ...measureLines(4),
      '',
      ...LABEL_LINES,
    ],
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
  return build(
    [IMPORT, BUTTON_IMPORT, TOOLTIP_IMPORT],
    ['NdsMessageTiming', 'NdsButton', '...NDS_TOOLTIP'],
    [
      '    <span ndsTooltip>',
      '      <!-- O GATILHO É DE QUEM CONSOME, e tem nome próprio: em toque não',
      '           há ponteiro, e o controle precisa dizer o que mostra mesmo com',
      '           a dica fechada. -->',
      '      <button',
      '        ndsTooltipTrigger',
      '        ndsButton',
      '        variant="ghost"',
      '        size="sm"',
      '        [attr.aria-label]="labels.title"',
      '      >{{ triggerLabel }}</button>',
      '',
      '      <ng-template ndsTooltipContent side="top">',
      '        <div',
      '          ndsMessageTiming',
      '          [stats]="measured"',
      '          [labels]="labels"',
      '        ></div>',
      '      </ng-template>',
      '    </span>',
    ],
    [
      ...writerLines(),
      '',
      ...measureLines(4),
      '',
      '  // O rótulo do gatilho é o número que resume a medição, e ele chega',
      '  // escrito como todos os outros.',
      "  readonly triggerLabel = this.written(1.24, 'second');",
      '',
      ...LABEL_LINES,
    ],
  );
}
