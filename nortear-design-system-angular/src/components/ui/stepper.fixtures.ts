/**
 * Fixture do Stepper — rótulo do fluxo, títulos das etapas e rótulos de estado.
 *
 * Rótulo do fluxo e títulos das etapas moram em constantes porque a play os
 * procura pelo NOME ACESSÍVEL. Literal escrito duas vezes é o defeito clássico
 * aqui: a busca deixa de casar com a fixture e a story lança em vez de reprovar.
 *
 * Mora FORA do `.stories.ts` porque ali todo export nomeado vira story na barra
 * lateral do Storybook — e fora do `.source.ts` porque a guarda transversal do
 * painel Code cobra que todo export de lá seja construtor de snippet. O snippet
 * e a story leem daqui, e por isso continuam ensinando o mesmo fluxo.
 */
import type { StepperLabels } from './stepper';

export const FLOW_LABEL = 'Progresso do cadastro';

export const STEP_TITLES = {
  account: 'Conta',
  address: 'Endereço',
  payment: 'Pagamento',
  review: 'Revisão',
} as const;

export const STATE_LABELS: StepperLabels = {
  completed: 'Etapa concluída',
  current: 'Etapa atual',
};

/** Quantas etapas a fixture declara — a play compara a contagem com isto. */
export const TOTAL_STEPS = 4;
