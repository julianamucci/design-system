/**
 * Transforms do painel Code do uso do contexto.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos e
 * passa a medição.
 *
 * O Playground é o único que escreve a medição inteira por extenso, e é de
 * propósito: lá os controls mudam consumo, teto e forma, e um snippet que
 * mostrasse só o nome de uma constante mentiria sobre o que a story renderiza.
 * Nas demais o que varia é a medição, e ela continua literal porque é o assunto
 * delas.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsContextDisplay } from '@/components/ui/context-display';";

const FORMS_IMPORT =
  "import { NdsContextDisplay, CONTEXT_DISPLAY_FORMS } from '@/components/ui/context-display';";

const COMPOSER_IMPORT = "import { NdsComposer } from '@/components/ui/composer';";

const BUDGET_IMPORT = "import { budgetLevel } from '@shared/primitives/token-budget';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ContextDisplaySnippetOptions = {
  /** Consumido pela pergunta. */
  input?: number;
  /** Consumido pela resposta. */
  output?: number;
  /** Teto da janela. Ausente quando não se sabe qual é. */
  limit?: number;
  /** Como desenhar o mesmo número. */
  form?: string;
  /** A medição aparece ao lado do campo de mensagem? */
  withField?: boolean;
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

/** `{ input: 18000, output: 7000, limit: 32000 }`, sem o teto quando não há. */
function usageLiteral(opts: ContextDisplaySnippetOptions): string {
  const parts = [`input: ${opts.input ?? 0}`, `output: ${opts.output ?? 0}`];
  if (opts.limit) parts.push(`limit: ${opts.limit}`);
  return `{ ${parts.join(', ')} }`;
}

/** As linhas do elemento, com a forma só quando ela não é a padrão. */
function element(opts: ContextDisplaySnippetOptions, indent: string): string[] {
  return [
    `${indent}<p`,
    `${indent}  ndsContextDisplay`,
    `${indent}  [usage]="${usageLiteral(opts)}"`,
    // A forma padrão não entra: documentação não ensina a repetir o que o
    // componente já assume.
    ...(opts.form && opts.form !== 'ring' ? [`${indent}  form="${opts.form}"`] : []),
    `${indent}  [labels]="labels"`,
    `${indent}></p>`,
  ];
}

function contextDisplayBuild(opts: ContextDisplaySnippetOptions = {}): string {
  if (opts.withField) {
    return build(
      [IMPORT, COMPOSER_IMPORT],
      ['NdsContextDisplay', 'NdsComposer'],
      [
        '    <!-- A medição é AUTÔNOMA: ela fica junto do campo, e nenhum arquivo',
        '         do campo sabe que ela existe. -->',
        ...element(opts, '    '),
        '',
        '    <nds-composer [labels]="fieldLabels" />',
      ],
      ['  readonly labels = contextDisplayLabels();', '  readonly fieldLabels = composerLabels();'],
    );
  }

  return build(
    [IMPORT],
    ['NdsContextDisplay'],
    element(opts, '    '),
    ['  readonly labels = contextDisplayLabels();'],
  );
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ContextDisplaySourceTransform = (
  code: string,
  ctx?: { args?: ContextDisplaySnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, que escreve a medição por extenso.
 *
 * Os args vêm dos controls: o consumo de cada origem, o teto e a forma.
 */
export const contextDisplaySource: ContextDisplaySourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return contextDisplayBuild({
    input: args.input,
    output: args.output,
    // Teto zero é a ausência de teto, e não um teto de zero: é o que o
    // primitivo já decide, e é o único caminho para essa medição por control.
    limit: args.limit || undefined,
    form: args.form,
  });
};

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração. A
 * fábrica devolveria FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegariam ao snippet. Nomeadas, cada uma é verificada.
 */
function withFixed(fixed: ContextDisplaySnippetOptions): ContextDisplaySourceTransform {
  return (_code, ctx) => contextDisplayBuild({ ...(ctx?.args ?? {}), ...fixed });
}

/**
 * As três formas, percorrendo a lista do componente.
 *
 * O snippet ensina a ITERAR `CONTEXT_DISPLAY_FORMS` em vez de escrever as três
 * à mão, que é o mesmo motivo de a constante existir: lista escrita à mão fica
 * para trás no dia em que o tipo cresce, e ninguém repara.
 */
export function contextDisplayEveryFormSource(): string {
  return build(
    [FORMS_IMPORT],
    ['NdsContextDisplay'],
    [
      '    @for (shape of forms; track shape) {',
      '      <p',
      '        ndsContextDisplay',
      '        [usage]="usage"',
      '        [form]="shape"',
      '        [labels]="labels"',
      '      ></p>',
      '    }',
    ],
    [
      '  readonly forms = CONTEXT_DISPLAY_FORMS;',
      '  readonly usage = { input: 18000, output: 7000, limit: 32000 };',
      '  readonly labels = contextDisplayLabels();',
    ],
  );
}

/** O anel: a forma compacta, ao lado de outros controles. */
export const contextDisplayRingSource = withFixed({
  input: 18_000,
  output: 7_000,
  limit: 32_000,
  form: 'ring',
});

/** A barra: a linha inteira, num painel só para ela. */
export const contextDisplayBarSource = withFixed({
  input: 18_000,
  output: 7_000,
  limit: 32_000,
  form: 'bar',
});

/** Só o número, sem medidor — para um rodapé. */
export const contextDisplayTextSource = withFixed({
  input: 18_000,
  output: 7_000,
  limit: 32_000,
  form: 'text',
});

/**
 * Os três níveis, percorrendo o primitivo compartilhado.
 *
 * O snippet mostra a CONTA, e não três medições escolhidas a dedo: quem lê
 * precisa saber de onde sai o nível, porque é isso que ele não pode reescrever
 * na própria tela.
 */
export function contextDisplayEveryLevelSource(): string {
  return build(
    [IMPORT, BUDGET_IMPORT],
    ['NdsContextDisplay'],
    [
      '    @for (usage of readings; track usage) {',
      '      <p',
      '        ndsContextDisplay',
      '        [usage]="usage"',
      '        [labels]="labels"',
      '      ></p>',
      '    }',
    ],
    [
      '  // O limiar é do primitivo, e a comparação é exata.',
      "  //   budgetLevel({ input: 16000, output: 0, limit: 32000 })  -> 'normal'",
      "  //   budgetLevel({ input: 24000, output: 0, limit: 32000 })  -> 'warning'",
      "  //   budgetLevel({ input: 30000, output: 0, limit: 32000 })  -> 'critical'",
      '  readonly readings = [',
      '    { input: 16000, output: 0, limit: 32000 },',
      '    { input: 24000, output: 0, limit: 32000 },',
      '    { input: 30000, output: 0, limit: 32000 },',
      '  ].filter((usage) => budgetLevel(usage) !== null);',
      '',
      '  readonly labels = contextDisplayLabels();',
    ],
  );
}

/** A borda do limiar: três quartos em ponto já são aviso. */
export const contextDisplayAtThresholdSource = withFixed({
  input: 20_000,
  output: 4_000,
  limit: 32_000,
});

/** Acima do teto: o medidor para no cheio e o número trava. */
export const contextDisplayOverLimitSource = withFixed({
  input: 26_000,
  output: 8_000,
  limit: 32_000,
});

/**
 * Sem teto conhecido: contagem, e nenhum medidor.
 *
 * O snippet omite o teto de propósito — é a ausência dele que produz esta
 * medição, e escrever um teto vazio ensinaria a mandar um campo em branco em
 * vez de não mandar campo.
 */
export const contextDisplayUnboundedSource = withFixed({ input: 18_000, output: 7_000 });

/**
 * A medição ao lado do campo de mensagem.
 *
 * Ela é AUTÔNOMA: fica junto do campo e nenhum arquivo do campo sabe que ela
 * existe. Por isso o snippet monta as duas lado a lado, e não passa uma para
 * dentro da outra.
 */
export const contextDisplayBesideFieldSource = withFixed({
  input: 18_000,
  output: 7_000,
  limit: 32_000,
  withField: true,
});
