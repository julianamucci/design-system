/**
 * Transforms do painel Code da tela do computador.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os passos, os
 * rótulos e a tela que projeta.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * A TELA ENTRA COMO ENCAIXE, e quase nunca por extenso. Ela é ESPAÇO de quem
 * consome (§1 da guideline 17), e um snippet que a montasse por dentro ensinaria
 * justamente o contrário do contrato: que a peça sabe desenhar a tela. O que o
 * snippet mostra é o par que faz o encaixe nesta stack — o `<ng-template #tela>`
 * e o `[screen]="tela"` —, e num dos snippets o que se põe ali dentro.
 *
 * TODO BINDING DO TEMPLATE É MEMBRO DECLARADO no próprio snippet, e não uma
 * constante importada no topo: expressão de template do Angular só enxerga
 * membro de classe, e quem copiasse receberia um binding que não resolve.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsComputerUse } from '@/components/ui/computer-use';";

const RUN_IMPORT = "import { NdsAgentStatus } from '@/components/ui/agent-status';";

const PROTOCOL_IMPORT = "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

/** O endereço das demonstrações. É o mesmo em quase toda foto. */
const DEFAULT_URL = 'app.exemplo.com/entrar';

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ComputerUseSnippetOptions = {
  /** Em que pé está a sessão. */
  status?: string;
  /** O nome do membro com os passos, ou nada quando a sessão ainda não tem. */
  stepsMember?: string;
  /** Qual passo está acontecendo agora. */
  activeIndex?: number;
  /** O endereço, por extenso. */
  url?: string;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ComputerUseSourceTransform = (
  code: string,
  ctx?: { args?: { status?: string; activeIndex?: number; withSteps?: boolean } },
) => string;

/**
 * O `<ng-template>` que carrega a tela, sem nada dentro.
 *
 * O comentário é o conteúdo de propósito: quem escreve a tela é quem consome, e
 * desenhá-la aqui ensinaria que a peça sabe fazê-la.
 */
const SCREEN_SLOT = [
  '    <!-- A TELA É ESPAÇO de quem consome. A peça instancia este template e',
  '         não escreve nem apaga o texto alternativo do que vier aqui. -->',
  '    <ng-template #tela>',
  '      <!-- a captura da sessão, ou o que estiver sendo dirigido -->',
  '    </ng-template>',
];

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

/** A figura, com as entradas que a configuração pede. */
function figure(opts: ComputerUseSnippetOptions, indent = '    '): string[] {
  return [
    `${indent}<figure`,
    `${indent}  ndsComputerUse`,
    `${indent}  url="${opts.url ?? DEFAULT_URL}"`,
    `${indent}  [screen]="tela"`,
    ...(opts.stepsMember ? [`${indent}  [steps]="${opts.stepsMember}"`] : []),
    // Sem passo nenhum não há rastro nem legenda, e o snippet acompanha: mandar
    // um índice sem lista ensinaria a apontar para um passo que não existe.
    ...(opts.stepsMember && opts.activeIndex !== undefined
      ? [`${indent}  [activeIndex]="${opts.activeIndex}"`]
      : []),
    `${indent}  status="${opts.status ?? 'running'}"`,
    `${indent}  [labels]="rotulos"`,
    `${indent}></figure>`,
  ];
}

/** A peça sozinha, na configuração que a story desenha. */
function single(opts: ComputerUseSnippetOptions): string {
  return build(
    [IMPORT],
    ['NdsComputerUse'],
    [...SCREEN_SLOT, '', ...figure(opts)],
    [
      ...(opts.stepsMember
        ? [
            '  // Os passos vêm de quem dirige a sessão: verbo, alvo e o PONTO em',
            '  // que o agente tocou, em porcentagem do quadro.',
            `  readonly ${opts.stepsMember} = passosDaSessao;`,
            '',
          ]
        : []),
      '  readonly rotulos = computerUseLabels();',
    ],
  );
}

/**
 * Transform do `meta` — o Playground, que escreve os eixos por extenso.
 *
 * Os args vêm dos controls: o estado, o índice e se houve passo.
 */
export const computerUseSource: ComputerUseSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({
    status: args.status,
    stepsMember: args.withSteps === false ? undefined : 'passos',
    activeIndex: args.withSteps === false ? undefined : args.activeIndex,
  });
};

/**
 * A moldura antes do primeiro toque.
 *
 * Quando a sessão ainda não tem passo, sobra o endereço e a tela. É o estado que
 * toda sessão atravessa, e o que mais escapa de quem só fotografa o meio.
 */
export function computerUseWithoutStepsSource(): string {
  return single({ status: 'idle' });
}

/** Enquanto o agente dirige: a peça se declara ocupada e a marca ativa pulsa. */
export function computerUseRunningSource(): string {
  return single({ status: 'running', stepsMember: 'passos', activeIndex: 3 });
}

/**
 * Quando a sessão termina, e a marca para de pulsar.
 *
 * O estado não some do desenho por ser o último: ele decide se a marca ainda
 * pulsa, e marca que pulsa depois do fim diz que o agente continua trabalhando.
 */
export function computerUseFinishedSource(): string {
  return single({ status: 'complete', stepsMember: 'passos', activeIndex: 5 });
}

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão, que
 * é o mesmo motivo de a constante existir: lista escrita à mão fica para trás no
 * dia em que o tipo cresce, e ninguém repara.
 */
export function computerUseEveryStatusSource(): string {
  return build(
    [IMPORT, PROTOCOL_IMPORT],
    ['NdsComputerUse'],
    [
      ...SCREEN_SLOT,
      '',
      '    @for (status of statuses; track status) {',
      '      <figure',
      '        ndsComputerUse',
      `        url="${DEFAULT_URL}"`,
      '        [screen]="tela"',
      '        [steps]="passos"',
      '        [activeIndex]="3"',
      '        [status]="status"',
      '        [labels]="rotulos"',
      '      ></figure>',
      '    }',
    ],
    [
      '  readonly statuses = RUN_STATUSES;',
      '',
      '  readonly passos = passosDaSessao;',
      '  readonly rotulos = computerUseLabels();',
    ],
  );
}

/**
 * O rastro no começo da sessão, quando ainda não há três marcas.
 *
 * O rastro mostra no máximo três, contando a ativa — e com um passo só há uma
 * marca. É o começo de toda sessão, e não uma borda rara.
 */
export function computerUseFirstStepSource(): string {
  return single({ status: 'running', stepsMember: 'passosCurtos', activeIndex: 0 });
}

/**
 * O índice preso ao alcance.
 *
 * Quem avança uma sessão incrementa um número, e o passo seguinte ao último é o
 * último — recusar deixaria a tela sem marca justamente quando a sessão acabou
 * de terminar.
 */
export function computerUseClampedSource(): string {
  return single({ status: 'complete', stepsMember: 'passos', activeIndex: 99 });
}

/**
 * O que se põe na tela, e o texto alternativo que vem com ela.
 *
 * É o único snippet que abre o encaixe, e é o que a §1 da guideline 17 obriga a
 * ensinar: a peça nunca cria imagem, e o texto alternativo é de quem projeta o
 * template. Vazio quando a legenda ao lado já diz o que está acontecendo.
 */
export function computerUseScreenSource(): string {
  return build(
    [IMPORT],
    ['NdsComputerUse'],
    [
      '    <ng-template #tela>',
      '      <!-- Texto alternativo VAZIO de propósito: a legenda ao lado já diz o',
      '           que está acontecendo, e descrever a tela de outro produto ou',
      '           repete a legenda ou narra coisa que não é desta peça. Quando a',
      '           tela carrega o que a legenda não diz, o texto é obrigatório — e',
      '           continua sendo de quem a projeta. -->',
      '      <img [src]="captura" alt="" />',
      '    </ng-template>',
      '',
      ...figure({ status: 'running', stepsMember: 'passos', activeIndex: 3 }),
    ],
    [
      '  // A captura é de quem dirige a sessão: a peça recebe um espaço, e',
      '  // qualquer conteúdo serve.',
      '  readonly captura = capturaDaSessao;',
      '',
      '  readonly passos = passosDaSessao;',
      '  readonly rotulos = computerUseLabels();',
    ],
  );
}

/**
 * A tela abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta inteira e carrega as ações de parar e repetir, a outra mostra onde
 * o agente está tocando. Por isso o snippet monta as duas em sequência, e não
 * passa uma para dentro da outra.
 */
export function computerUseBesideRunSource(): string {
  return build(
    [RUN_IMPORT, IMPORT],
    ['NdsAgentStatus', 'NdsComputerUse'],
    [
      '    <!-- As duas são AUTÔNOMAS: nenhuma sabe que a outra existe. A linha',
      '         de estado controla a execução; a moldura é o REGISTRO de onde o',
      '         agente está tocando. -->',
      '    <p',
      '      ndsAgentStatus',
      '      status="running"',
      '      elapsed="0:42"',
      '      [labels]="rotulosDaExecucao"',
      '    ></p>',
      '',
      ...SCREEN_SLOT,
      '',
      ...figure({ status: 'running', stepsMember: 'passos', activeIndex: 3 }),
    ],
    [
      '  readonly passos = passosDaSessao;',
      '',
      '  readonly rotulos = computerUseLabels();',
      '  readonly rotulosDaExecucao = agentStatusLabels();',
    ],
  );
}

/**
 * A proporção do quadro, na folha de quem consome.
 *
 * Tela de telefone é retrato, e a peça não tem como saber. Entra como propriedade
 * personalizada, e não como altura em estilo embutido: é a única maneira de
 * mudá-la sem tirar o valor do tema e da escala de tipo.
 */
export function computerUsePortraitSource(): string {
  return [
    build(
      [IMPORT],
      ['NdsComputerUse'],
      [
        ...SCREEN_SLOT,
        '',
        ...figure({
          url: 'm.exemplo.com/entrar',
          status: 'running',
          stepsMember: 'passos',
          activeIndex: 2,
        }),
      ],
      [
        '  readonly passos = passosDaSessao;',
        '  readonly rotulos = computerUseLabels();',
      ],
    ),
    '',
    '/* A proporção do quadro, na folha de quem consome. */',
    '.nds-computer-use {',
    '  --computer-use-aspect: 9 / 16;',
    '}',
  ].join('\n');
}
