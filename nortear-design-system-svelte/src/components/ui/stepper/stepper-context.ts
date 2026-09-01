/**
 * Contexto do Stepper — o canal por onde o estado desce da raiz até o gatilho.
 *
 * O `bits-ui` NÃO tem Stepper, então esta stack monta o componente em Svelte 5
 * puro. O estado de cada etapa é DERIVADO (item compara o próprio número com o
 * valor do fluxo), e quem precisa dele — gatilho e indicador — está dois níveis
 * abaixo do `<li>`. Passar por prop obrigaria o consumidor a repetir o número
 * da etapa em cada peça; contexto entrega o mesmo sem ruído na composição.
 *
 * Os dois contextos carregam GETTERS, e não valores: o objeto é criado uma vez
 * na inicialização do componente, mas cada leitura acontece dentro do consumidor
 * e reassina a dependência reativa. Guardar `value` como número congelaria o
 * estado no primeiro quadro.
 */
import { getContext, setContext } from 'svelte';

export type StepperState = 'inactive' | 'active' | 'completed';

/**
 * Palavras de estado lidas só por leitor de tela.
 *
 * Ausentes, nada é anunciado — e aí a diferença entre concluída e futura fica
 * só na marca de verificação, que é visual.
 */
export interface StepperLabels {
  completed?: string;
  current?: string;
}

export interface StepperRootContext {
  /** Número da etapa atual do fluxo, contando de 1. */
  readonly value: number;
  readonly labels: StepperLabels;
  /** Chamado pelo gatilho de uma etapa disponível. */
  select: (step: number) => void;
}

export interface StepperItemContext {
  readonly step: number;
  readonly state: StepperState;
  readonly disabled: boolean;
}

const ROOT_KEY = Symbol('nds-stepper-root');
const ITEM_KEY = Symbol('nds-stepper-item');

export function setStepperRootContext(context: StepperRootContext): void {
  setContext(ROOT_KEY, context);
}

/**
 * O erro é explícito porque a falha silenciosa aqui é pior: sem raiz, o gatilho
 * renderizaria sem `aria-current` e o indicador sem número, e a página pareceria
 * apenas mal estilizada.
 */
export function getStepperRootContext(): StepperRootContext {
  const context = getContext<StepperRootContext | undefined>(ROOT_KEY);
  if (!context) {
    throw new Error('Esta peça do Stepper precisa estar dentro de <Stepper>.');
  }
  return context;
}

export function setStepperItemContext(context: StepperItemContext): void {
  setContext(ITEM_KEY, context);
}

export function getStepperItemContext(): StepperItemContext {
  const context = getContext<StepperItemContext | undefined>(ITEM_KEY);
  if (!context) {
    throw new Error('Esta peça do Stepper precisa estar dentro de <StepperItem>.');
  }
  return context;
}

/**
 * Estado de uma etapa a partir do valor do fluxo.
 *
 * `completed` explícito vence a comparação: é como uma etapa POSTERIOR à atual
 * conta como concluída num fluxo que aceita ordem fora do comum.
 */
export function resolveStepperState(
  step: number,
  value: number,
  completed: boolean,
): StepperState {
  if (completed || step < value) return 'completed';
  if (step === value) return 'active';
  return 'inactive';
}
