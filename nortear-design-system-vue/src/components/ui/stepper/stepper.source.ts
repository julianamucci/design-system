/**
 * Transforms do painel Code do Stepper.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Sem elas o painel mostra a tag da raiz sozinha — `<Stepper value="2" />` —, e
 * o assunto do componente é justamente a composição: item, gatilho, indicador,
 * título e traço encaixados na ordem certa.
 *
 * Três decisões valem para todos os snippets daqui:
 *
 * 1. O `aria-label` da raiz é obrigatório. Sem ele o leitor de tela anuncia uma
 *    lista e nada mais, sem dizer de que progresso se trata.
 * 2. Os rótulos de estado entram sempre que existem. São eles que levam "Etapa
 *    concluída" a quem não vê a marca de verificação, e um exemplo sem eles
 *    ensina a metade que depende de cor.
 * 3. O traço fica DENTRO do item, depois do gatilho, e o último item não tem
 *    traço — é assim que a folha alcança `.nds-stepper-item[data-state]
 *    .nds-stepper-separator` sem regra extra.
 *
 * Os identificadores são ingleses; o texto DENTRO do snippet é português,
 * porque é ele que a pessoa lê e copia.
 */
import { attr, attrs, attrsMultilinha, indentar, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type StepperArgs = {
  value: number;
  'aria-label': string;
  labels: { completed?: string; current?: string };
};

type Step = {
  step: number;
  title: string;
  description?: string;
  completed?: boolean;
  disabled?: boolean;
};

const FLOW_LABEL = 'Progresso do cadastro';

const STATE_LABELS = { completed: 'Etapa concluída', current: 'Etapa atual' };

const FLOW_STEPS: Step[] = [
  { step: 1, title: 'Conta', description: 'Seus dados' },
  { step: 2, title: 'Endereço', description: 'Onde entregar' },
  { step: 3, title: 'Pagamento', description: 'Forma de pagar' },
  { step: 4, title: 'Revisão', description: 'Confira e envie' },
];

/** As três primeiras etapas, sem descrição, para os exemplos de estado. */
const SHORT_STEPS: Step[] = FLOW_STEPS.slice(0, 3).map(({ step, title }) => ({ step, title }));

const PARTS = [
  'Stepper',
  'StepperDescription',
  'StepperIndicator',
  'StepperItem',
  'StepperSeparator',
  'StepperTitle',
  'StepperTrigger',
];

/**
 * Importa só as peças que o exemplo usa.
 *
 * A lista fixa envelhece na direção errada: ela cresce quando alguém acrescenta
 * uma peça ao design system e passa a ensinar import morto em todo snippet.
 */
function importParts(template: string): string {
  const used = PARTS.filter((part) => new RegExp(`<${part}[\\s/>]`).test(template));
  const inline = `import { ${used.join(', ')} } from '@/components/ui/stepper'`;
  if (inline.length <= 72) return inline;
  return `import {\n${used.map((part) => `  ${part},`).join('\n')}\n} from '@/components/ui/stepper'`;
}

/** Aspas simples dentro do objeto de rótulos quebrariam o literal do exemplo. */
function word(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.replace(/'/g, '’') : undefined;
}

/**
 * `:labels="{ completed: '…', current: '…' }"`.
 *
 * O control de objeto chega à transform como OBJETO, e interpolado direto vira
 * `[object Object]` no painel — por isso cada campo é lido e montado à mão.
 */
function labelsAttr(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const { completed, current } = value as { completed?: unknown; current?: unknown };
  const fields = [
    word(completed) ? `completed: '${word(completed)}'` : '',
    word(current) ? `current: '${word(current)}'` : '',
  ].filter(Boolean);
  return fields.length ? `:labels="{ ${fields.join(', ')} }"` : '';
}

function stepMarkup(item: Step, total: number): string {
  const content = [
    '<StepperIndicator />',
    `<StepperTitle>${item.title}</StepperTitle>`,
    item.description ? `<StepperDescription>${item.description}</StepperDescription>` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const opening = `<StepperItem${attrs(
    `:step="${item.step}"`,
    item.completed ? 'completed' : '',
    item.disabled ? 'disabled' : '',
  )}>`;

  const separator = item.step < total ? '\n  <StepperSeparator />' : '';

  return `${opening}\n  <StepperTrigger>\n${indentar(content, 4)}\n  </StepperTrigger>${separator}\n</StepperItem>`;
}

function rootMarkup(options: {
  /** Número literal, ou o nome da variável que a aplicação usa no exemplo. */
  value: number | string;
  ariaLabel?: string;
  labels?: unknown;
  onSelect?: string;
  steps: Step[];
}): string {
  const { value, ariaLabel = FLOW_LABEL, labels = STATE_LABELS, onSelect, steps } = options;
  const total = steps.length;
  const head = attrsMultilinha([
    `:value="${value}"`,
    attr('aria-label', ariaLabel),
    labelsAttr(labels),
    onSelect ? `@step-select="${onSelect}"` : '',
  ]);
  const body = steps.map((item) => stepMarkup(item, total)).join('\n\n');
  return `<Stepper${head}>\n${indentar(body)}\n</Stepper>`;
}

/**
 * Fecha o SFC: imports na ordem em que o projeto os escreve — o que vem do
 * framework antes do que vem do design system —, e o estado depois deles.
 */
function compose(template: string, state = ''): string {
  const imports = [
    state.includes('ref(') ? "import { ref } from 'vue'" : '',
    importParts(template),
  ]
    .filter(Boolean)
    .join('\n');
  return vueSnippet(state ? `${imports}\n\n${state}` : imports, template);
}

/**
 * Playground — o fluxo inteiro, com o valor e os rótulos vindos dos controls.
 *
 * O número da etapa atual é o control que muda a estrutura visível, e por isso a
 * caixa de código tem de acompanhá-lo.
 */
export const stepperSource: SourceTransform<StepperArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return compose(
    rootMarkup({
      value: typeof args.value === 'number' ? args.value : 2,
      ariaLabel: typeof args['aria-label'] === 'string' ? args['aria-label'] : FLOW_LABEL,
      labels: args.labels ?? STATE_LABELS,
      steps: FLOW_STEPS,
    }),
  );
};

/** Etapa depois da atual: número em círculo neutro, sem palavra de estado. */
export const stepperInactiveSource: SourceTransform<StepperArgs> = () =>
  compose(rootMarkup({ value: 1, steps: SHORT_STEPS }));

/** Etapa igual ao valor do fluxo: é ela que recebe `aria-current="step"`. */
export const stepperActiveSource: SourceTransform<StepperArgs> = () =>
  compose(rootMarkup({ value: 2, steps: SHORT_STEPS }));

/** Concluída fora de ordem: a marca de verificação toma o lugar do número. */
export const stepperCompletedSource: SourceTransform<StepperArgs> = () =>
  compose(
    rootMarkup({
      value: 1,
      steps: SHORT_STEPS.map((item) => (item.step === 3 ? { ...item, completed: true } : item)),
    }),
  );

/** Indisponível: o gatilho sai da ordem de tabulação, em vez de ficar focável e mudo. */
export const stepperDisabledSource: SourceTransform<StepperArgs> = () =>
  compose(
    rootMarkup({
      value: 1,
      steps: SHORT_STEPS.map((item) => (item.step === 3 ? { ...item, disabled: true } : item)),
    }),
  );

/**
 * Fluxo completo — quem consome guarda a etapa atual e reage à seleção.
 *
 * O `ref` entra no snippet porque sem ele o exemplo não funciona: o valor é
 * propriedade da aplicação, e o componente só o exibe e avisa da escolha.
 */
export const stepperWizardSource: SourceTransform<StepperArgs> = () =>
  compose(
    rootMarkup({
      value: 'etapa',
      steps: FLOW_STEPS.map(({ step, title }) => ({ step, title })),
      onSelect: 'etapa = $event',
    }),
    'const etapa = ref(1)',
  );

/** Texto de apoio sob o título, quando o nome da etapa não basta sozinho. */
export const stepperWithDescriptionsSource: SourceTransform<StepperArgs> = () =>
  compose(rootMarkup({ value: 2, steps: FLOW_STEPS }));
