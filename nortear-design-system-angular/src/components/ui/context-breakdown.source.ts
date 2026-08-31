/**
 * Transforms do painel Code da repartição do contexto.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos e
 * passa a repartição.
 *
 * Cada configuração tem a SUA constante exportada, chamável SEM argumento.
 * Fábrica curried exportada devolveria função em vez de string, e a guarda
 * transversal (`source-snippets.test.ts`), que chama todo export sem argumento,
 * nunca chegaria ao snippet.
 *
 * O Playground é o único que escreve a repartição inteira por extenso, e é de
 * propósito: lá os controls mudam quanto cada origem trouxe, e um snippet que
 * mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o que varia é a repartição, e ela vem dos exemplos compartilhados
 * — que é justamente o que se quer ensinar, porque é de lá que sai a ordem.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsContextBreakdown } from '@/components/ui/context-breakdown';";

const DISPLAY_IMPORT = "import { NdsContextDisplay } from '@/components/ui/context-display';";

const COLLAPSIBLE_IMPORT = "import { NDS_COLLAPSIBLE } from '@/components/ui/collapsible';";

const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";

const EXAMPLES_IMPORT = [
  'import {',
  '  CONTEXT_PARTS_TYPICAL,',
  '  CONTEXT_PARTS_SLIVER,',
  '  CONTEXT_PARTS_SINGLE,',
  '  CONTEXT_PARTS_EMPTY,',
  "} from '@shared/primitives/context-breakdown-examples';",
].join('\n');

const TYPICAL_IMPORT =
  "import { CONTEXT_PARTS_TYPICAL } from '@shared/primitives/context-breakdown-examples';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ContextBreakdownSnippetOptions = {
  /** Consumido pelas instruções do sistema. */
  system?: number;
  /** Consumido pelo histórico da conversa. */
  history?: number;
  /** Consumido pelos anexos. */
  attachments?: number;
  /** Consumido pelos resultados de ferramenta. */
  tools?: number;
};

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

/**
 * A lista de parcelas por extenso, uma por linha.
 *
 * Uma linha por parcela, e não um objeto compacto: a ORDEM é o que a peça
 * preserva, e uma lista em coluna é a forma em que reordenar chama atenção.
 */
function partsLiteral(opts: ContextBreakdownSnippetOptions): string[] {
  const rows: Array<[string, number]> = [
    ['system', opts.system ?? 0],
    ['history', opts.history ?? 0],
    ['attachments', opts.attachments ?? 0],
    ['tools', opts.tools ?? 0],
  ];
  return [
    '  readonly parts = [',
    ...rows.map(([id, tokens]) => `    { id: '${id}', tokens: ${tokens} },`),
    '  ];',
  ];
}

/** As linhas do elemento. A raiz é `<div>`: o corpo da peça é uma lista. */
function element(indent: string, parts = 'parts'): string[] {
  return [
    `${indent}<div`,
    `${indent}  ndsContextBreakdown`,
    `${indent}  [parts]="${parts}"`,
    `${indent}  [labels]="labels"`,
    `${indent}></div>`,
  ];
}

function contextBreakdownBuild(opts: ContextBreakdownSnippetOptions = {}): string {
  return build(
    [IMPORT],
    ['NdsContextBreakdown'],
    element('    '),
    [...partsLiteral(opts), '  readonly labels = contextBreakdownLabels();'],
  );
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ContextBreakdownSourceTransform = (
  code: string,
  ctx?: { args?: ContextBreakdownSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que escreve a repartição por extenso.
 *
 * Os args vêm dos controls: quanto cada origem trouxe.
 */
export const contextBreakdownSource: ContextBreakdownSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return contextBreakdownBuild({
    system: args.system,
    history: args.history,
    attachments: args.attachments,
    tools: args.tools,
  });
};

/**
 * Transforms de story: mesmo componente, repartição fixa por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração.
 * A fábrica devolveria FUNÇÃO, e a guarda transversal chama todo export sem
 * argumento esperando string — curried, as checagens que LEEM o snippet nunca
 * chegariam ao snippet. Nomeadas, cada uma é verificada.
 */
function withFixed(fixed: ContextBreakdownSnippetOptions): ContextBreakdownSourceTransform {
  return (_code, ctx) => contextBreakdownBuild({ ...(ctx?.args ?? {}), ...fixed });
}

/**
 * As quatro repartições, percorrendo os exemplos compartilhados.
 *
 * O snippet ensina a IMPORTAR a repartição de exemplo em vez de escrevê-la à
 * mão, que é o mesmo motivo de o módulo compartilhado existir: a ordem das
 * parcelas decide a cor de cada fatia, e cinco listas escritas à mão divergiriam
 * na ordem antes de divergirem no número.
 */
export function contextBreakdownEveryCaseSource(): string {
  return build(
    [IMPORT, EXAMPLES_IMPORT],
    ['NdsContextBreakdown'],
    [
      '    <!-- A ordem é a de quem mediu, e a peça não a reordena: parcela que',
      '         sobe de lugar entre um turno e o seguinte faz comparar duas fotos',
      '         diferentes achando que é a mesma. -->',
      '    @for (repartition of readings; track $index) {',
      ...element('      ', 'repartition'),
      '    }',
    ],
    [
      '  readonly readings = [',
      '    CONTEXT_PARTS_TYPICAL,',
      '    CONTEXT_PARTS_SLIVER,',
      '    CONTEXT_PARTS_SINGLE,',
      '    CONTEXT_PARTS_EMPTY,',
      '  ];',
      '',
      '  readonly labels = contextBreakdownLabels();',
    ],
  );
}

/** Uma parcela que vale quase nada — e continua com nome e número. */
export const contextBreakdownSliverSource = withFixed({
  system: 1_200,
  history: 18_400,
  attachments: 5_300,
  tools: 100,
});

/** Uma origem levou tudo, e as outras três continuam na lista, em zero. */
export const contextBreakdownSingleOriginSource = withFixed({
  system: 0,
  history: 25_000,
  attachments: 0,
  tools: 0,
});

/**
 * Nada repartido ainda.
 *
 * As parcelas continuam na lista valendo zero: o vazio aqui é VERDADE, e não a
 * ausência de uma medição — esta peça não precisa de teto para existir.
 */
export const contextBreakdownEmptySource = withFixed({
  system: 0,
  history: 0,
  attachments: 0,
  tools: 0,
});

/**
 * Uma origem sem palavra.
 *
 * O snippet se produz TIRANDO um rótulo, e nunca inventando uma parcela: o que
 * falta é o que se sabe dizer sobre a repartição, e não a repartição.
 */
export function contextBreakdownUnlabeledOriginSource(): string {
  return build(
    [IMPORT, TYPICAL_IMPORT],
    ['NdsContextBreakdown'],
    element('    '),
    [
      '  readonly parts = CONTEXT_PARTS_TYPICAL;',
      '',
      '  // Sem palavra para a origem, a linha mostra o ENDEREÇO dela. Uma linha',
      '  // em branco deixaria a cor sozinha dizendo de qual parcela se trata.',
      '  readonly labels = {',
      "    title: 'De onde veio o contexto',",
      "    unit: 'tokens',",
      '    parts: {',
      "      system: 'Instruções do sistema',",
      "      history: 'Histórico da conversa',",
      '    },',
      '  };',
    ],
  );
}

/**
 * A repartição ao lado da medição da janela.
 *
 * As duas são AUTÔNOMAS e respondem perguntas diferentes: uma diz de onde veio
 * o que já foi gasto, a outra diz quanto ainda cabe. Por isso o snippet monta as
 * duas lado a lado, e não passa uma para dentro da outra — e só a segunda
 * recebe teto.
 */
export function contextBreakdownBesideBudgetSource(): string {
  return build(
    [IMPORT, DISPLAY_IMPORT, TYPICAL_IMPORT],
    ['NdsContextBreakdown', 'NdsContextDisplay'],
    [
      '    <!-- "De onde veio" se responde sem saber quanto cabe: o teto é da',
      '         outra, e nenhuma das duas vive dentro da outra. -->',
      '    <p',
      '      ndsContextDisplay',
      '      [usage]="{ input: 18000, output: 7000, limit: 32000 }"',
      '      [labels]="budgetLabels"',
      '    ></p>',
      '',
      ...element('    '),
    ],
    [
      '  readonly parts = CONTEXT_PARTS_TYPICAL;',
      '  readonly labels = contextBreakdownLabels();',
      '  readonly budgetLabels = contextDisplayLabels();',
    ],
  );
}

/**
 * A repartição dentro de um bloco que expande.
 *
 * Recolher é COMPOSIÇÃO, e não recurso da peça: esconder a legenda esconderia
 * justamente o texto que dispensa a cor. Quem precisa dela recolhida põe o
 * controle por fora, onde o teclado já sabe encontrá-lo.
 *
 * DIVERGÊNCIA DE FORMA, e é de framework: aqui o gatilho JÁ É o botão — as
 * diretivas moram no mesmo `<button>`, em vez de um botão pronto ser passado
 * como conteúdo de uma opção. É o que mantém `aria-expanded` no elemento que se
 * aperta, sem código de ligação.
 */
export function contextBreakdownInsideDisclosureSource(): string {
  return build(
    [IMPORT, COLLAPSIBLE_IMPORT, BUTTON_IMPORT, TYPICAL_IMPORT],
    ['NdsContextBreakdown', '...NDS_COLLAPSIBLE', 'NdsButton'],
    [
      '    <div ndsCollapsible [defaultOpen]="true" class="nds-max-w-lg">',
      '      <!-- O controle mora no hospedeiro, e é botão de verdade: recolher a',
      '           legenda esconde o texto que dispensa a cor, então quem o faz',
      '           assume a decisão. -->',
      '      <button',
      '        ndsCollapsibleTrigger',
      '        ndsButton',
      '        variant="outline"',
      '        size="sm"',
      '      >{{ labels.title }}</button>',
      '',
      '      <div ndsCollapsiblePanel>',
      ...element('        '),
      '      </div>',
      '    </div>',
    ],
    [
      '  readonly parts = CONTEXT_PARTS_TYPICAL;',
      '  readonly labels = contextBreakdownLabels();',
    ],
  );
}
