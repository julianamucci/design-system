import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'

export { default as InputGroup } from './InputGroup.vue'
export { default as InputGroupAddon } from './InputGroupAddon.vue'
export { default as InputGroupButton } from './InputGroupButton.vue'
export { default as InputGroupInput } from './InputGroupInput.vue'
export { default as InputGroupText } from './InputGroupText.vue'
export { default as InputGroupTextarea } from './InputGroupTextarea.vue'

/**
 * Onde o addon fica. As duas em bloco fazem o grupo virar coluna.
 *
 * Correção: aqui havia um `cva` com as QUATRO posições mapeadas para string
 * vazia. Código morto que fingia existir uma classe por posição — a folha
 * `docs/shared/styles/nds/input-group.css` posiciona o addon por `[data-align]`
 * e por mais nada. Um `cva` de variantes vazias é pior do que nenhum: quem lê
 * procura a classe que ele promete, não acha, e conclui que a folha está
 * incompleta.
 */
export type InputGroupAlign = 'inline-start' | 'inline-end' | 'block-start' | 'block-end'

/**
 * Medidas do botão apertado que cabem dentro da moldura.
 *
 * Mesma correção: o `cva` de tamanho também tinha todas as variantes vazias. A
 * medida do botão é do `Button` — é ele que rende `nds-button-xs` e companhia —,
 * e `.nds-input-group-button` só APERTA o espaçamento por cima disso.
 */
export type InputGroupButtonSize = 'xs' | 'sm' | 'icon-xs' | 'icon-sm'

export interface InputGroupButtonProps {
  variant?: ButtonVariants['variant']
  size?: InputGroupButtonSize
  /**
   * Tipo nativo do botão. Nasce `'button'` para que o botão do addon não
   * submeta o formulário em volta; quem precisa de um botão de envio dentro da
   * moldura declara `type="submit"`.
   */
  type?: 'button' | 'submit' | 'reset'
  class?: HTMLAttributes['class']
}
