/**
 * Transforms do painel Code do cartão de autorização.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os controles em
 * template e faz alguma coisa com a escolha relatada.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * O Playground é o único que escreve a pergunta por extenso, e é de propósito:
 * lá os controls a mudam, e um snippet que mostrasse só o nome de uma
 * propriedade mentiria sobre o que a story renderiza. Nas demais o assunto é a
 * FORMA do cartão, e o que varia é qual argumento chega — por isso o alcance
 * aparece como nome de propriedade, que é como quem consome o escreve.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsApprovalCard } from '@/components/ui/approval-card';";

const BUTTON_IMPORT = "import { NdsButton } from '@/components/ui/button';";

const GROUP_IMPORT = "import { NdsToolGroup } from '@/components/ui/tool-group';";

const SUMMARY_IMPORT =
  "import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';";

const PROTOCOL_IMPORT =
  "import type { ChatToolCall } from '@shared/primitives/chat-protocol';";

const DEFAULT_QUESTION = 'Permitir que o agente publique o relatório?';

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ApprovalCardSnippetOptions = {
  /** A pergunta, por extenso. */
  question?: string;
  /** O nome do exemplo que carrega o alcance. Ausente desenha sem lista. */
  scope?: string;
  /** O cartão recebe controles? Só então a saída tem para onde ir. */
  actions?: boolean;
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ApprovalCardSourceTransform = (
  code: string,
  ctx?: { args?: { question?: string; scope?: string } },
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

/**
 * Os controles, num template só.
 *
 * Nesta stack `actions` recebe `TemplateRef`, e cada entrada é um pedaço do
 * espaço da resposta — a peça instancia o que chega, na ordem em que chega.
 * Nenhum deles carrega ênfase, e é decisão: num cartão que pede autorização,
 * destacar "Permitir" empurra para permitir.
 */
const CHOICES_TEMPLATE = [
  '    <ng-template #choices>',
  '      @for (choice of choices; track choice.value) {',
  '        <button',
  '          ndsButton',
  '          type="button"',
  '          variant="outline"',
  '          size="sm"',
  '          [attr.data-approval-choice]="choice.value"',
  '        >{{ choice.label }}</button>',
  '      }',
  '    </ng-template>',
  '',
];

/**
 * O que fazer com a escolha, escrito uma vez.
 *
 * O que ela significa é do produto: o cartão relata qual controle foi acionado
 * e para aí. O que acontece ao recusar, se há campo de motivo e se a escolha
 * vale para as próximas não estão aqui, e não vão estar.
 */
const ANSWER = [
  '',
  '  // O cartão relata a escolha e para aí: o que ela significa é do produto.',
  '  answer(choice: string): void {',
  '    this.applyPolicy(choice);',
  '  }',
];

/** O alcance nomeado pelo exemplo: é assim que quem consome o declara. */
function scopeProperty(name: string): string {
  return `${name}Scope`;
}

/** A declaração daquele alcance no corpo da classe. */
function scopeField(name: string): string {
  return `  readonly ${scopeProperty(name)} = approvalScope('${name}');`;
}

/** O cartão, com o que aquela configuração liga. */
function card(opts: ApprovalCardSnippetOptions): string[] {
  const wired = opts.actions !== false;
  return [
    '    <div',
    '      ndsApprovalCard',
    `      question="${opts.question ?? DEFAULT_QUESTION}"`,
    ...(opts.scope ? [`      [scope]="${scopeProperty(opts.scope)}"`] : []),
    ...(wired ? ['      [actions]="[choices]"', '      (choose)="answer($event)"'] : []),
    '    ></div>',
  ];
}

function single(opts: ApprovalCardSnippetOptions): string {
  const wired = opts.actions !== false;

  return build(
    wired ? [IMPORT, BUTTON_IMPORT] : [IMPORT],
    wired ? ['NdsApprovalCard', 'NdsButton'] : ['NdsApprovalCard'],
    [...(wired ? CHOICES_TEMPLATE : []), ...card(opts)],
    [
      ...(opts.scope ? [scopeField(opts.scope)] : []),
      // Sem controle nenhum não há o que escolher, então a saída não teria como
      // disparar: mostrá-la ali ensinaria a ligar um fio solto.
      ...(wired ? ['  readonly choices = approvalChoices();', ...ANSWER] : []),
    ],
  );
}

/** Transform do `meta` — o Playground, que escreve a pergunta por extenso. */
export const approvalCardSource: ApprovalCardSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({
    question: args.question,
    scope: args.scope && args.scope !== 'none' ? args.scope : undefined,
  });
};

/** O cartão inteiro: a pergunta, o alcance e o espaço da resposta. */
export function approvalCardWithScopeSource(): string {
  return single({ scope: 'publish' });
}

/**
 * Sem alcance.
 *
 * O snippet não passa a lista, e é o assunto: a peça não desenha uma caixa vazia
 * no lugar dela.
 */
export function approvalCardWithoutScopeSource(): string {
  return single({});
}

/**
 * O caminho comprido.
 *
 * Ele entra inteiro, e é o que a story mostra: alcance pela metade é autorização
 * pela metade, então o valor quebra em vez de receber reticências.
 */
export function approvalCardLongDetailSource(): string {
  return single({ scope: 'writeFile' });
}

/**
 * Mais de duas escolhas.
 *
 * A ordem é a do produto do exemplo, e a peça não a conhece: para ela, o espaço
 * dos controles é uma lista de templates que chega pronta.
 */
export function approvalCardManyChoicesSource(): string {
  return single({ scope: 'spend' });
}

/**
 * Sem controle nenhum.
 *
 * A caixa da resposta não é desenhada, e a saída some junto — não há o que
 * escolher. A pergunta continua à vista, e responder passa a depender de algo
 * que está fora do cartão.
 */
export function approvalCardWithoutActionsSource(): string {
  return single({ scope: 'publish', actions: false });
}

/**
 * A execução que espera por uma pessoa, FORA da caixa recolhida.
 *
 * Quem separa é quem consome, e a conta vem do vocabulário compartilhado. Um
 * componente que filtrasse sozinho apagaria da tela um dado que recebeu.
 */
export function approvalCardOutsideTheGroupSource(): string {
  return build(
    [IMPORT, GROUP_IMPORT, BUTTON_IMPORT, SUMMARY_IMPORT, PROTOCOL_IMPORT],
    ['NdsApprovalCard', 'NdsToolGroup', 'NdsButton'],
    [
      ...CHOICES_TEMPLATE,
      '    <!-- À vista, e antes do que já aconteceu: pedir autorização dentro',
      '         de uma caixa fechada é pedir sem mostrar. -->',
      '    @for (item of split.waiting; track item.name) {',
      '      <div',
      '        ndsApprovalCard',
      '        question="Permitir que o agente conceda o acesso?"',
      '        [scope]="scopeOfWaiting(item)"',
      '        [actions]="[choices]"',
      '        (choose)="answer($event)"',
      '      ></div>',
      '    }',
      '',
      '    <details ndsToolGroup [calls]="split.grouped" [labels]="groupLabels"></details>',
    ],
    [
      '  readonly calls: ChatToolCall[] = [];',
      '',
      '  // A separação é feita AQUI, e não dentro de um componente: um que',
      '  // filtrasse sozinho apagaria da tela um dado que recebeu.',
      '  readonly split = splitWaitingCalls(this.calls);',
      '  readonly choices = approvalChoices();',
      '  readonly groupLabels = toolGroupLabels();',
      '',
      '  // O alcance sai da chamada que espera: quem monta a pergunta é quem',
      '  // sabe o que ela abrange. Precisa ser MEMBRO da classe — expressão de',
      '  // template não enxerga função importada nem constante de módulo.',
      '  scopeOfWaiting(call: ChatToolCall): string {',
      '    return call.name;',
      '  }',
      ...ANSWER,
    ],
  );
}

/**
 * Quem responde, e quem só estava ali.
 *
 * O atributo é o único pedaço do contrato que atravessa a fronteira: quem
 * escreve é quem monta os controles, e é ele que diz qual deles conta como
 * resposta.
 */
export function approvalCardAnsweringSource(): string {
  return build(
    [IMPORT, BUTTON_IMPORT],
    ['NdsApprovalCard', 'NdsButton'],
    [
      '    <!-- Só o controle que traz o atributo conta como resposta. -->',
      '    <ng-template #allowOnce>',
      '      <button',
      '        ndsButton',
      '        type="button"',
      '        variant="outline"',
      '        size="sm"',
      '        data-approval-choice="allow-once"',
      '      >Permitir uma vez</button>',
      '    </ng-template>',
      '',
      '    <!-- Este não traz, e por isso não dispara nada. -->',
      '    <ng-template #learnMore>',
      '      <button ndsButton type="button" variant="ghost" size="sm">Saiba mais</button>',
      '    </ng-template>',
      '',
      '    <div',
      '      ndsApprovalCard',
      `      question="${DEFAULT_QUESTION}"`,
      `      [scope]="${scopeProperty('publish')}"`,
      '      [actions]="[allowOnce, learnMore]"',
      '      (choose)="answer($event)"',
      '    ></div>',
    ],
    [scopeField('publish'), ...ANSWER],
  );
}
