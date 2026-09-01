/**
 * Andaime compartilhado das stories do Stepper.
 *
 * Existe porque os três arquivos de story montam o MESMO fluxo de quatro etapas
 * e precisam das mesmas consultas ao DOM. Copiado por arquivo, o helper diverge
 * sem sinal: mesmo nome, comportamento diferente, e corrigir um não corrige os
 * outros.
 *
 * Só andaime de teste mora aqui — nada disto é superfície do design system, e é
 * por isso que o arquivo fica fora da cobertura.
 */

/** Nome acessível do fluxo demonstrado. */
export const FLOW_LABEL = "Progresso do cadastro"

/** As quatro etapas, na ordem em que acontecem. */
export const STEP_TITLES = ["Conta", "Endereço", "Pagamento", "Revisão"] as const

/** Texto de apoio de cada etapa, na mesma ordem. */
export const STEP_HINTS = [
  "Seus dados",
  "Onde entregar",
  "Forma de pagar",
  "Confira e envie",
] as const

/** Palavras de estado do fluxo — lidas só por leitor de tela. */
export const STATE_LABELS = {
  completed: "Etapa concluída",
  current: "Etapa atual",
}

/** Rótulos dos controles de navegação do fluxo completo. */
export const BACK_LABEL = "Voltar"
export const NEXT_LABEL = "Avançar"

/**
 * A raiz do Stepper dentro da story.
 *
 * Consultada a cada uso, e nunca guardada: o painel Interactions reexecuta a
 * play no mesmo DOM, e um nó da rodada anterior pode já ter sido substituído —
 * ler o atributo dele devolveria o valor de antes.
 */
export function stepperRoot(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!
}

/** O item de uma etapa, pelo número que ela carrega no DOM. */
export function stepperItem(canvasElement: HTMLElement, step: number): HTMLElement {
  return canvasElement.querySelector<HTMLElement>(
    `[data-slot="stepper-item"][data-step="${step}"]`
  )!
}

/** Uma peça de dentro de uma etapa — gatilho, indicador, rótulo de estado. */
export function stepperPart(
  canvasElement: HTMLElement,
  step: number,
  slot: string
): HTMLElement {
  return canvasElement.querySelector<HTMLElement>(
    `[data-slot="stepper-item"][data-step="${step}"] [data-slot="${slot}"]`
  )!
}
