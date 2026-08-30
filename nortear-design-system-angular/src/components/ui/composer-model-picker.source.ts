/**
 * Transforms do painel Code do seletor de modelo.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos,
 * guarda a lista e faz alguma coisa com o modelo confirmado.
 *
 * A LISTA NÃO É ESCRITA POR EXTENSO em nenhuma das configurações, e isso é
 * decisão. Os controles do Playground mexem em qual modelo está escolhido e em
 * se a lista começa aberta — não nos modelos —, então despejar três objetos de
 * andaime faria o painel ensinar o andaime em vez da peça. O que muda por
 * story é o nome do sinal, que é o que diz QUAL lista está na tela.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT_PICKER =
  "import { NdsComposerModelPicker } from '@/components/ui/composer-model-picker';";
const IMPORT_COMPOSER = "import { NdsComposer } from '@/components/ui/composer';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ModelPickerSnippetOptions = {
  /** Nome do sinal da lista que o snippet declara. */
  models?: string;
  /** O endereço do modelo escolhido. */
  value?: string;
  /** A lista começa aberta? */
  open?: boolean;
  /** O snippet monta o seletor dentro do trilho do campo? */
  rail?: boolean;
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(imports: string[], declared: string[], inner: string[], body: string[]): string {
  return [
    ...imports,
    '',
    '@Component({',
    `  imports: [${declared.join(', ')}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** As entradas do seletor, no recuo que o snippet pede. */
function pickerLines(opts: ModelPickerSnippetOptions, indent: string, labels: string): string[] {
  const models = opts.models ?? 'models';
  return [
    `${indent}<nds-composer-model-picker`,
    `${indent}  [labels]="${labels}"`,
    `${indent}  [models]="${models}()"`,
    `${indent}  [value]="chosen()"`,
    // Documentação não ensina a repetir o padrão: a lista fechada é o repouso,
    // e só a que abre de saída precisa dizer que abre.
    ...(opts.open ? [`${indent}  [open]="true"`] : []),
    `${indent}  (valueChange)="choose($event)"`,
    `${indent}/>`,
  ];
}

/** O estado que o seletor observa, e o que se faz com o modelo confirmado. */
function pickerBody(opts: ModelPickerSnippetOptions): string[] {
  const models = opts.models ?? 'models';
  return [
    '  // Os modelos são de quem monta a conversa: o seletor desenha o que recebe.',
    `  readonly ${models} = signal<ModelOption[]>([]);`,
    `  readonly chosen = signal('${opts.value ?? 'fast'}');`,
    '',
    '  // O componente NÃO troca de modelo: ele avisa qual foi confirmado e',
    '  // devolve o controle. Quem sabe o que a troca custa é quem monta a conversa.',
    '  choose(model: ModelOption): void {',
    '    this.chosen.set(model.id);',
    '  }',
  ];
}

function modelPickerSnippet(opts: ModelPickerSnippetOptions = {}): string {
  if (!opts.rail) {
    return build(
      [IMPORT_PICKER],
      ['NdsComposerModelPicker'],
      pickerLines(opts, '    ', 'labels'),
      ['  readonly labels = modelLabels();', ...pickerBody(opts)],
    );
  }

  // O seletor é AUTÔNOMO: ele não é uma entrada do campo, é um controle que
  // quem consome põe no início do trilho — pelo mesmo espaço de qualquer outro.
  return build(
    [IMPORT_PICKER, IMPORT_COMPOSER],
    ['NdsComposer', 'NdsComposerModelPicker'],
    [
      '    <ng-template #rail>',
      ...pickerLines(opts, '      ', 'pickerLabels'),
      '    </ng-template>',
      '',
      '    <nds-composer [labels]="labels" [railStart]="rail" />',
    ],
    [
      '  readonly labels = composerLabels();',
      '  readonly pickerLabels = modelLabels();',
      ...pickerBody(opts),
    ],
  );
}

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type ModelPickerSourceTransform = (
  code: string,
  ctx?: { args?: ModelPickerSnippetOptions },
) => string;

/**
 * Transform do `meta` — o Playground, cujos controles mexem no escolhido e em
 * se a lista começa aberta.
 */
export const composerModelPickerSource: ModelPickerSourceTransform = (_code, ctx) =>
  modelPickerSnippet(ctx?.args ?? {});

/**
 * Transforms de story: mesmo componente, opções fixas por cima dos args.
 *
 * Uma por configuração, e não uma fábrica exportada que recebe a configuração. A
 * fábrica devolveria FUNÇÃO, e a guarda transversal (`source-snippets.test.ts`)
 * chama todo export sem argumento esperando string — curried, as checagens que
 * LEEM o snippet nunca chegariam ao snippet. Nomeadas, cada uma é verificada.
 */
function withFixed(fixed: ModelPickerSnippetOptions): ModelPickerSourceTransform {
  return (_code, ctx) => modelPickerSnippet({ ...(ctx?.args ?? {}), ...fixed });
}

/** A lista aberta, em que a descrição é o único assunto. */
export const modelPickerDescriptionsSource = withFixed({ models: 'available', open: true });

/** A lista com a etiqueta curta ao lado de um dos nomes. */
export const modelPickerBadgeSource = withFixed({ models: 'badged', open: true });

/** Em repouso: o gatilho com o nome escolhido, e nenhuma lista no documento. */
export const modelPickerClosedSource = withFixed({ value: 'balanced', open: false });

/** Com um modelo que não pode responder agora. */
export const modelPickerUnavailableSource = withFixed({ value: 'fast', open: true });

/** O seletor no início do trilho do campo. */
export const modelPickerInRailSource = withFixed({ value: 'fast', rail: true, open: false });
