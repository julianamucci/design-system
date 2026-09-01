import type { ComputedRef, InjectionKey } from 'vue';

/**
 * Contexto do Stepper — o estado de cada etapa é DERIVADO, nunca escrito à mão.
 *
 * A raiz publica o valor atual do fluxo e os rótulos de estado; cada item
 * compara o próprio número com esse valor e chega sozinho a concluída, atual ou
 * ainda não alcançada. É o mesmo desenho das outras stacks, e é o que faz o
 * fluxo continuar correto quando alguém acrescenta ou remove uma etapa.
 */

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

export interface StepperContext {
  /** Número da etapa atual, contando de 1. */
  value: ComputedRef<number>;
  /**
   * Rótulos de estado. Moram na RAIZ, e não no gatilho, porque o estado de uma
   * etapa MUDA quando o fluxo avança: uma palavra fixa por gatilho estaria
   * errada no passo seguinte.
   */
  labels: ComputedRef<StepperLabels>;
  /** Repassa a seleção de uma etapa disponível para quem consome a raiz. */
  select: (step: number) => void;
}

export interface StepperItemContext {
  step: ComputedRef<number>;
  state: ComputedRef<StepperState>;
  disabled: ComputedRef<boolean>;
}

export const STEPPER_KEY: InjectionKey<StepperContext> = Symbol('nds-stepper');
export const STEPPER_ITEM_KEY: InjectionKey<StepperItemContext> = Symbol('nds-stepper-item');
