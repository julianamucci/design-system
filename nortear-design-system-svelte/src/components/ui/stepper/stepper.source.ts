/**
 * Transforms do painel Code do Stepper.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * `transform` e não `code`: um snippet fixo deixaria de acompanhar os controls —
 * mudar a etapa atual no painel não mudaria nada na caixa de código. E um `code`
 * definido faz o gerador dinâmico nem chegar a rodar.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type StepperArgs = {
  value: number;
};

type StepEntry = {
  step: number;
  title: string;
  description?: string;
  completed?: boolean;
  disabled?: boolean;
};

type Composition = {
  steps: StepEntry[];
  /** Etapa atual na montagem — é o valor inicial do `$state`. */
  value: number;
  flowLabel: string;
};

const IMPORT = `import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";`;

const LABELS = `labels={{ completed: "Etapa concluída", current: "Etapa atual" }}`;

const FLOW_LABEL = 'Progresso do cadastro';

const DEFAULT_STEPS: StepEntry[] = [
  { step: 1, title: 'Conta' },
  { step: 2, title: 'Endereço' },
  { step: 3, title: 'Pagamento' },
  { step: 4, title: 'Revisão' },
];

const DESCRIBED_STEPS: StepEntry[] = [
  { step: 1, title: 'Conta', description: 'Seus dados' },
  { step: 2, title: 'Endereço', description: 'Onde entregar' },
  { step: 3, title: 'Pagamento', description: 'Forma de pagar' },
  { step: 4, title: 'Revisão', description: 'Confira e envie' },
];

/**
 * Uma etapa: item, gatilho com indicador, título e — quando houver — descrição.
 * O traço mora DENTRO do item, depois do gatilho, e a última etapa não o tem.
 */
function buildItem(entry: StepEntry, isLast: boolean): string {
  const item = attrs(
    `step={${entry.step}}`,
    entry.completed ? 'completed' : '',
    entry.disabled ? 'disabled' : '',
  );
  const description = entry.description
    ? `\n      <StepperDescription>${entry.description}</StepperDescription>`
    : '';
  const separator = isLast ? '' : '\n    <StepperSeparator />';

  return `  <StepperItem${item}>
    <StepperTrigger>
      <StepperIndicator />
      <StepperTitle>${entry.title}</StepperTitle>${description}
    </StepperTrigger>${separator}
  </StepperItem>`;
}

/**
 * Monta a composição inteira: raiz nomeada com os rótulos de estado e um item
 * por etapa. O nome do fluxo e os rótulos nunca ficam de fora — são eles que
 * separam concluída de futura para quem não vê a marca de verificação.
 */
function build({ steps, value, flowLabel }: Composition): string {
  const items = steps
    .map((entry, index) => buildItem(entry, index === steps.length - 1))
    .join('\n\n');

  return svelteSnippet(
    `${IMPORT}

let value = $state(${value});`,
    `<Stepper
  {value}
  aria-label="${flowLabel}"
  ${LABELS}
  onStepSelect={(step) => (value = step)}
>
${items}
</Stepper>`,
  );
}

/**
 * Forma canônica: quatro etapas, a atual vinda do control. Serve o Playground e
 * cascateia para as stories sem composição própria.
 */
export function stepperSource(_generated?: string, ctx?: { args?: Partial<StepperArgs> }): string {
  const { value = 2 } = ctx?.args ?? {};

  return build({ steps: DEFAULT_STEPS, value, flowLabel: FLOW_LABEL });
}

/** Fluxo recém-aberto: nada concluído ainda, e a primeira etapa é a atual. */
export function stepperInactiveSource(): string {
  return build({ steps: DEFAULT_STEPS, value: 1, flowLabel: FLOW_LABEL });
}

/**
 * Etapa fora de ordem marcada como concluída — o `completed` explícito só é
 * necessário quando o fluxo aceita ordem fora do comum.
 */
export function stepperForcedCompletedSource(): string {
  return build({
    steps: [
      { step: 1, title: 'Conta' },
      { step: 2, title: 'Endereço' },
      { step: 3, title: 'Pagamento' },
      { step: 4, title: 'Revisão', completed: true },
    ],
    value: 2,
    flowLabel: FLOW_LABEL,
  });
}

/** Etapa indisponível: o gatilho sai da ordem de tabulação. */
export function stepperDisabledSource(): string {
  return build({
    steps: [
      { step: 1, title: 'Conta' },
      { step: 2, title: 'Endereço' },
      { step: 3, title: 'Pagamento', disabled: true },
      { step: 4, title: 'Revisão', disabled: true },
    ],
    value: 2,
    flowLabel: FLOW_LABEL,
  });
}

/** Etapas com texto de apoio sob o título. */
export function stepperWithDescriptionsSource(): string {
  return build({ steps: DESCRIBED_STEPS, value: 2, flowLabel: FLOW_LABEL });
}

/**
 * Fluxo completo: indicador, painel da etapa e os controles de voltar e avançar.
 *
 * O foco vai para o painel a cada troca porque o componente NÃO tem região viva:
 * quem anuncia o avanço é o conteúdo que mudou.
 */
export function stepperWizardSource(): string {
  const items = DESCRIBED_STEPS.map((entry, index) =>
    buildItem(entry, index === DESCRIBED_STEPS.length - 1),
  ).join('\n\n');

  return svelteSnippet(
    `import { tick } from "svelte";
import { Button } from "@/components/ui/button";
${IMPORT}

const total = 4;

let value = $state(2);
let panel: HTMLDivElement | null = $state(null);

async function goTo(step: number) {
  if (step < 1 || step > total) return;
  value = step;
  // Sem região viva: quem anuncia o avanço é o painel que trocou de conteúdo.
  await tick();
  panel?.focus();
}`,
    `<Stepper
  {value}
  aria-label="${FLOW_LABEL}"
  ${LABELS}
  onStepSelect={goTo}
>
${items}
</Stepper>

<div bind:this={panel} tabindex="-1" aria-labelledby="etapa-atual" class="nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack" data-spacing="sm">
  <h3 id="etapa-atual" class="nds-text-body nds-font-semibold">Endereço</h3>
  <p class="nds-text-body">Rua, número, cidade e CEP.</p>
</div>

<div class="nds-cluster" data-spacing="md">
  <Button variant="outline" disabled={value === 1} onclick={() => goTo(value - 1)}>Voltar</Button>
  <Button disabled={value === total} onclick={() => goTo(value + 1)}>Avançar</Button>
</div>`,
  );
}
