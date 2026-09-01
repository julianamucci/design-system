// Snippet do painel Code do Stepper — ver `@/lib/story-source`.

import {
  appendLine,
  callLine,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

/**
 * O `import` do Stepper é SEMPRE de muitos nomes — sete fábricas e a função de
 * resolução —, então ele nasce quebrado em linhas. O `importing` do módulo
 * compartilhado continua valendo para os módulos de um nome só; aqui a linha
 * única passaria de 150 colunas dentro de um painel estreito.
 */
function multilineImport(names: string[]): string {
  return `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/stepper';`;
}

/** Uma etapa, como a story a descreve. */
export type StepperSnippetStep = {
  title: string;
  /** Texto de apoio sob o título. Ausente, a fábrica da descrição nem entra. */
  description?: string;
  /** Conta como concluída mesmo estando depois da atual. */
  completed?: boolean;
  /** Indisponível: o gatilho sai da ordem de tabulação. */
  disabled?: boolean;
};

/** O que as stories usam das opções do Stepper e o snippet precisa mostrar. */
export type StepperSnippetOptions = {
  /**
   * Nome acessível do fluxo. É opção obrigatória da fábrica, então ela aparece
   * no snippet mesmo quando a story não a troca.
   */
  'aria-label'?: string;
  /** Valor atual do fluxo, aplicado por `setStepperValue` depois da montagem. */
  value?: number;
  /** As etapas, na ordem em que acontecem. */
  steps?: StepperSnippetStep[];
  /** Palavras de estado lidas só por leitor de tela. */
  labels?: { completed?: string; current?: string };
  /** Corpo do ouvinte de seleção, quando a story reporta a etapa escolhida. */
  onStepSelect?: string;
};

const FLOW_LABEL_DEFAULT = 'Progresso do cadastro';
const VALUE_DEFAULT = 2;
const STEPS_DEFAULT: StepperSnippetStep[] = [
  { title: 'Conta' },
  { title: 'Endereço' },
  { title: 'Pagamento' },
  { title: 'Revisão' },
];

/** `{ completed: '…', current: '…' }`, só com as palavras que a story passou. */
function labelsLiteral(labels: StepperSnippetOptions['labels']): string | undefined {
  if (!labels) return undefined;
  const pairs = options([
    ['completed', labels.completed ? text(labels.completed) : undefined],
    ['current', labels.current ? text(labels.current) : undefined],
  ]);
  if (!pairs.length) return undefined;
  return `{ ${pairs.map((p) => p.replace(/,$/, '')).join(', ')} }`;
}

/** `{ completed: true }` / `{ disabled: true }` — o estado declarado no item. */
function stateLiteral(step: StepperSnippetStep): string | undefined {
  const pairs = options([
    ['completed', step.completed ? 'true' : undefined],
    ['disabled', step.disabled ? 'true' : undefined],
  ]);
  if (!pairs.length) return undefined;
  return `{ ${pairs.map((p) => p.replace(/,$/, '')).join(', ')} }`;
}

/**
 * A chamada real da família `createStepper*` com as opções da story.
 *
 * A etapa é construída por uma função curta declarada no próprio snippet — é a
 * mesma peça repetida quatro vezes, e escrevê-la quatro vezes ensinaria a
 * repetição em vez do componente. A assinatura dessa função ACOMPANHA a story:
 * sem texto de apoio ela não recebe `description`, sem etapa marcada ela não
 * recebe o objeto de estado. Parâmetro que a story não usa vira ruído que o
 * leitor copia.
 */
export function stepperSnippet(o: StepperSnippetOptions = {}): string {
  const steps = o.steps ?? STEPS_DEFAULT;
  const value = o.value ?? VALUE_DEFAULT;
  const hasDescription = steps.some((s) => s.description);
  const hasState = steps.some((s) => s.completed || s.disabled);

  const names = [
    'createStepper',
    'createStepperItem',
    'createStepperTrigger',
    'createStepperIndicator',
    'createStepperTitle',
  ];
  if (hasDescription) names.push('createStepperDescription');
  if (steps.length > 1) names.push('createStepperSeparator');
  names.push('setStepperValue');

  const root = callLine(
    'createStepper',
    options([
      ['aria-label', text(o['aria-label'] ?? FLOW_LABEL_DEFAULT)],
      ['labels', labelsLiteral(o.labels)],
      [
        'onStepSelect',
        o.onStepSelect ? `(step) => {\n    ${o.onStepSelect}\n  }` : undefined,
      ],
    ]),
  );

  const params = ['step: number', 'title: string'];
  if (hasDescription) params.push('description: string');
  if (hasState) params.push('state: { completed?: boolean; disabled?: boolean } = {}');

  const triggerChildren = [
    'createStepperIndicator()',
    'createStepperTitle({ text: title })',
    hasDescription ? 'createStepperDescription({ text: description })' : undefined,
  ].filter(Boolean) as string[];

  const stepHelper = `/** Uma etapa: o círculo, o nome e o que mais o gatilho anuncia. */
const etapa = (${params.join(', ')}) => {
  const item = createStepperItem({ step${hasState ? ', ...state' : ''} });
  const gatilho = createStepperTrigger();
  gatilho.append(
${triggerChildren.map((c) => `    ${c},`).join('\n')}
  );
  item.appendChild(gatilho);
  return item;
};`;

  const calls = steps.map((step, i) => {
    const args = [String(i + 1), text(step.title)];
    if (hasDescription) args.push(text(step.description ?? ''));
    if (hasState) {
      const state = stateLiteral(step);
      if (state) args.push(state);
    }
    return `  etapa(${args.join(', ')}),`;
  });

  const separatorBlock =
    steps.length > 1
      ? `// O traço mora DENTRO da etapa, depois do gatilho — e a última não tem
// para onde apontar.
etapas.slice(0, -1).forEach((item) => item.appendChild(createStepperSeparator()));`
      : undefined;

  return snippet(
    multilineImport(names),
    `const stepper = ${root};`,
    stepHelper,
    `const etapas = [\n${calls.join('\n')}\n];`,
    separatorBlock,
    `stepper.append(...etapas);`,
    `// Segunda fase: sem runtime reativo, o estado de cada etapa só pode ser
// resolvido depois que todas existem.
setStepperValue(stepper, ${value});`,
    appendLine('stepper'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Sem args, cai no
 * fluxo canônico de quatro etapas com a segunda em curso.
 */
export const stepperSource: SourceTransform<StepperSnippetOptions> = (_gerado, ctx) =>
  stepperSnippet(ctx.args ?? {});

/** Transform de story: mesma família, opções fixas que os controls não cobrem. */
export function stepperSourceWith(
  fixed: StepperSnippetOptions,
): SourceTransform<StepperSnippetOptions> {
  return (_gerado, ctx) => stepperSnippet({ ...ctx.args, ...fixed });
}
