/**
 * Transforms do painel Code do grupo de ferramentas.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara as chamadas e
 * os rótulos, e que monta o elemento que de fato se importa.
 *
 * A RAIZ É O PRÓPRIO `<details>`, então todo snippet daqui escreve o elemento
 * com o atributo do diretivo em cima dele. Um `<nds-tool-group>` inventado
 * ensinaria a importar uma peça que não existe — e, pior, tiraria o
 * `<details>`, que é de onde vêm o botão, o estado de expansão e o teclado.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * — `source-snippets.test.ts` — nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve as chamadas por extenso, e é de propósito:
 * lá os controls mudam a caixa e a presença do detalhe, e um snippet que
 * mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o que varia é a lista, e ela chega por um nome que o leitor já viu
 * no andaime.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsToolGroup } from '@/components/ui/tool-group';";

const CALL_IMPORT = "import type { ChatToolCall } from '@shared/primitives/chat-protocol';";

const STATES_IMPORT =
  "import { TOOL_CALL_STATES, type ChatToolCall } from '@shared/primitives/chat-protocol';";

const SPLIT_IMPORT =
  "import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ToolGroupSnippetOptions = {
  /** O nome da lista que entra no grupo, como o leitor a veria no código. */
  calls?: string;
  /** A caixa começa aberta? Só entra no snippet quando difere do padrão. */
  open?: boolean;
  /** O retorno tem para onde ir? */
  change?: boolean;
  /** Cada chamada traz o detalhe do que couber ao estado dela? */
  detail?: boolean;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    '  imports: [NdsToolGroup],',
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** O elemento, com só o que difere do padrão escrito nele. */
function groupLines(
  pad: string,
  opts: { calls: string; open?: boolean; change?: boolean },
): string[] {
  const lines = [
    `${pad}<details`,
    `${pad}  ndsToolGroup`,
    `${pad}  [calls]="${opts.calls}"`,
    `${pad}  [labels]="labels"`,
  ];
  // A caixa fechada é o padrão, e documentação não ensina a repetir o padrão:
  // só o que difere entra no snippet.
  if (opts.open) lines.push(`${pad}  [open]="true"`);
  if (opts.change) lines.push(`${pad}  (openChange)="register($event)"`);
  lines.push(`${pad}></details>`);
  return lines;
}

/**
 * As chamadas por extenso, na ordem em que o tipo declara os campos.
 *
 * O detalhe É CAMPO DE CADA CHAMADA, e não opção do grupo: por isso o control
 * do Playground não troca uma propriedade, troca a LISTA — e o snippet mostra
 * isso escrevendo a lista sem o campo, em vez de fingir uma opção que não
 * existe.
 */
function callsLiteral(detail: boolean): string[] {
  const rows = [
    { name: 'buscar_documentos', state: 'done', detail: 'Doze resultados em quatro repositórios.' },
    { name: 'publicar_relatorio', state: 'failed', detail: 'O destino recusou: falta permissão.' },
  ];
  return [
    '  // As chamadas chegam de quem executou a resposta, na ordem em que',
    '  // aconteceram. O grupo desenha o que recebe, e não filtra nada.',
    '  readonly calls: ChatToolCall[] = [',
    ...rows.map((row) => {
      const fields = [
        `name: '${row.name}'`,
        `state: '${row.state}'`,
        detail ? `detail: '${row.detail}'` : undefined,
      ].filter((field): field is string => field !== undefined);
      return `    { ${fields.join(', ')} },`;
    }),
    '  ];',
  ];
}

/** A linha que fecha toda classe de exemplo: o texto da caixa. */
const LABELS_LINE = '  readonly labels = toolGroupLabels();';

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ToolGroupSourceTransform = (
  code?: string,
  ctx?: { args?: ToolGroupSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que escreve as chamadas por extenso.
 *
 * Os args vêm dos controls: a caixa aberta e a presença do detalhe.
 */
export const toolGroupSource: ToolGroupSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return build(
    [IMPORT, CALL_IMPORT],
    groupLines('    ', { calls: 'calls', open: args.open === true, change: true }),
    [...callsLiteral(args.detail !== false), LABELS_LINE],
  );
};

/** O mesmo componente, com a lista pronta que o exemplo desenha. */
function fromList(calls: string): string {
  return build([IMPORT], groupLines('    ', { calls: 'calls', change: true }), [
    `  readonly calls = ${calls};`,
    LABELS_LINE,
  ]);
}

/**
 * Os quatro estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `TOOL_CALL_STATES` em vez de escrever a lista à
 * mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function toolGroupEveryStateSource(): string {
  return build(
    [IMPORT, STATES_IMPORT],
    groupLines('    ', { calls: 'calls', open: true }),
    [
      '  // A lista sai do vocabulário compartilhado, e não de quatro linhas',
      '  // escritas à mão: estado novo entra sozinho, e nada fica para trás.',
      '  readonly calls: ChatToolCall[] = TOOL_CALL_STATES.map((state) => ({',
      '    name: `ferramenta_${state}`,',
      '    state,',
      '  }));',
      LABELS_LINE,
    ],
  );
}

/** O grupo com uma falha, ainda recolhido — o que a peça existe para servir. */
export function toolGroupFailedSource(): string {
  return fromList('callsWithFailure');
}

/** O grupo em que tudo terminou bem. */
export function toolGroupDoneSource(): string {
  return fromList('doneCalls');
}

/** O grupo que ainda corre. */
export function toolGroupRunningSource(): string {
  return fromList('runningCalls');
}

/**
 * Abrir e fechar, e o aviso que sai das duas vezes.
 *
 * O snippet mostra o retorno recebendo o NOVO estado, e não um pedido de troca:
 * quem abriu foi o navegador, e a peça só relata o que já aconteceu. `open`
 * mais `openChange` também dão o atalho de duas vias desta stack, e quem quiser
 * a caixa controlada escreve `[(open)]` sem fiação extra.
 */
export function toolGroupTogglingSource(): string {
  return build(
    [IMPORT],
    groupLines('    ', { calls: 'calls', change: true }),
    [
      '  readonly calls = callsWithFailure;',
      LABELS_LINE,
      '',
      '  protected expanded = false;',
      '',
      '  protected register(open: boolean): void {',
      '    // O novo estado chega junto: ninguém precisa ler o elemento de volta.',
      '    this.expanded = open;',
      '  }',
    ],
  );
}

/**
 * A chamada que espera por uma pessoa, FORA do grupo recolhido.
 *
 * O snippet ensina a separação, e não o filtro escrito à mão:
 * `splitWaitingCalls` vem do vocabulário compartilhado, e é o que impede cinco
 * condições com o mesmo literal solto dentro.
 */
export function toolGroupWaitingOutsideSource(): string {
  return build(
    [IMPORT, SPLIT_IMPORT],
    [
      '    <div class="nds-stack nds-max-w-lg" data-spacing="sm">',
      '      <!-- À vista e aberta: pedir autorização dentro de uma caixa fechada',
      '           é pedir sem mostrar. -->',
      ...groupLines('      ', { calls: 'waiting', open: true }),
      ...groupLines('      ', { calls: 'grouped' }),
      '    </div>',
    ],
    [
      '  // Quem separa é quem CONSOME. Um componente que filtrasse sozinho',
      '  // apagaria da tela um dado que recebeu.',
      '  private readonly split = splitWaitingCalls(callsWithFailure);',
      '  readonly waiting = this.split.waiting;',
      '  readonly grouped = this.split.grouped;',
      LABELS_LINE,
    ],
  );
}

/**
 * Onde o grupo mora: antes da resposta, e sem anunciar nada.
 *
 * As chamadas chegam enquanto o texto é gerado logo abaixo. Quem quiser
 * anunciar põe a região viva por fora, sabendo o que está fazendo.
 */
export function toolGroupBeforeAnswerSource(): string {
  return build(
    [IMPORT],
    [
      '    <div class="nds-stack nds-max-w-lg" data-spacing="sm">',
      ...groupLines('      ', { calls: 'calls' }),
      '      <p>{{ answer }}</p>',
      '    </div>',
    ],
    [
      '  readonly calls = callsWithFailure;',
      LABELS_LINE,
      "  readonly answer = 'São 54 slugs de conteúdo compartilhado.';",
    ],
  );
}
