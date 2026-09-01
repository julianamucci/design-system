import {
  createStepper,
  createStepperDescription,
  createStepperIndicator,
  createStepperItem,
  createStepperSeparator,
  createStepperTitle,
  createStepperTrigger,
  setStepperValue,
  type StepperLabels,
} from './stepper';

/**
 * Andaime das stories do Stepper — um construtor, três arquivos de story.
 *
 * O módulo existe pelo mesmo motivo do `tabs.fixtures.ts`: num `*.stories.ts`
 * todo export nomeado vira story, então a função de montagem apareceria como
 * uma aba fantasma na barra lateral. Sem lugar para morar, ela seria copiada
 * três vezes — e cópia de andaime é como a regra `fixture_duplicada_entre_
 * stories` nasceu.
 *
 * O que ele monta é EXATAMENTE o que `stepper.source.ts` ensina no painel Code.
 * Os dois andam juntos de propósito: snippet que diverge da story mente sobre o
 * que a story renderiza, e ninguém percebe — o painel Code não entra no DOM da
 * play.
 */

/** Uma etapa, do jeito que a story a descreve antes de virar DOM. */
export interface StepperStepDef {
  /** Número desta etapa, contando de 1. */
  step: number;
  title: string;
  description?: string;
  /** Conta como concluída mesmo estando depois da atual. */
  completed?: boolean;
  /** Indisponível: o gatilho sai da ordem de tabulação. */
  disabled?: boolean;
}

export interface BuildStepperOptions {
  /** Nome acessível do fluxo. Sem ele o leitor de tela anuncia só uma lista. */
  'aria-label': string;
  /** Valor atual do fluxo, aplicado por `setStepperValue` depois da montagem. */
  value: number;
  steps: StepperStepDef[];
  labels?: StepperLabels;
  onStepSelect?: (step: number) => void;
  class?: string;
}

/**
 * Nome do fluxo das stories. É o mesmo texto que a docs page usa em
 * `demonstration.labels.flow`, e ele nomeia o landmark: repetido à mão em cada
 * arquivo, uma story sairia com outro nome e nenhuma asserção veria.
 */
export const FLOW_LABEL = 'Progresso do cadastro';

/**
 * Palavras de estado só para leitor de tela. São a metade programática da
 * decisão 3 do primitivo — a marca de verificação é a metade visual.
 */
export const STATE_LABELS: StepperLabels = {
  completed: 'Etapa concluída',
  current: 'Etapa atual',
};

/** As quatro etapas canônicas das stories, sem texto de apoio. */
export const SIGNUP_STEPS: StepperStepDef[] = [
  { step: 1, title: 'Conta' },
  { step: 2, title: 'Endereço' },
  { step: 3, title: 'Pagamento' },
  { step: 4, title: 'Revisão' },
];

/** As mesmas etapas, com o texto de apoio sob o título. */
export const SIGNUP_STEPS_WITH_DESCRIPTIONS: StepperStepDef[] = [
  { step: 1, title: 'Conta', description: 'Seus dados' },
  { step: 2, title: 'Endereço', description: 'Onde entregar' },
  { step: 3, title: 'Pagamento', description: 'Forma de pagar' },
  { step: 4, title: 'Revisão', description: 'Confira e envie' },
];

/**
 * Monta o fluxo inteiro e resolve o estado das etapas.
 *
 * A montagem tem DUAS FASES, e é assim de propósito: sem runtime reativo, o
 * estado de cada etapa só pode ser resolvido depois que todas existem. A
 * segunda fase é `setStepperValue`, e esquecê-la deixa toda etapa em
 * `inactive` — que é como o item nasce.
 */
export function buildStepper(options: BuildStepperOptions): HTMLOListElement {
  const root = createStepper({
    'aria-label': options['aria-label'],
    labels: options.labels,
    onStepSelect: options.onStepSelect,
    class: options.class,
  });

  const items = options.steps.map((def) => {
    const item = createStepperItem({
      step: def.step,
      completed: def.completed,
      disabled: def.disabled,
    });

    const trigger = createStepperTrigger();
    trigger.append(createStepperIndicator(), createStepperTitle({ text: def.title }));
    if (def.description) {
      trigger.appendChild(createStepperDescription({ text: def.description }));
    }

    item.appendChild(trigger);
    return item;
  });

  // O traço mora DENTRO da etapa, depois do gatilho — e a última não tem para
  // onde apontar.
  items.slice(0, -1).forEach((item) => item.appendChild(createStepperSeparator()));

  root.append(...items);
  setStepperValue(root, options.value);

  return root;
}

/** O gatilho da etapa `step`, ou `null` — a busca por papel não o alcança. */
export function triggerOfStep(root: HTMLElement, step: number): HTMLButtonElement | null {
  return root.querySelector<HTMLButtonElement>(
    `[data-slot="stepper-item"][data-step="${step}"] [data-slot="stepper-trigger"]`,
  );
}

/** O item da etapa `step`, ou `null`. */
export function itemOfStep(root: HTMLElement, step: number): HTMLLIElement | null {
  return root.querySelector<HTMLLIElement>(
    `[data-slot="stepper-item"][data-step="${step}"]`,
  );
}
