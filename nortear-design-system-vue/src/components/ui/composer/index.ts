import type { TriggerSpec } from '@shared/primitives/composer-trigger'

export { default as Composer } from './Composer.vue'

/**
 * O vocabulário do compositor.
 *
 * A API DIVERGE da raiz imperativa da referência, e é assim que tem de ser. Lá
 * ela expõe `getValue()`, `setValue()` e `setRunning()`; aqui o texto é um
 * `v-model:value` e o estado de geração é a PROP `running`. Divergência de API
 * de framework não se "alinha": registra-se.
 *
 * O motivo é o mesmo dos dois lados. Quem sabe se a resposta está sendo gerada
 * é quem consome — o componente não acompanha a rede —, e a diferença é só por
 * onde esse estado entra: lá por um método, aqui por uma prop que o render lê.
 *
 * A segunda divergência é o trilho. Ele não é `HTMLElement[]`: é um SLOT COM
 * ESCOPO (`#railStart`), que é a forma desta stack para "marcação que quem
 * consome fornece". O conceito é o mesmo — o trilho é um ESPAÇO, e o composer
 * reserva o lugar sem saber o que se põe nele.
 */

/** Como se pede o envio pelo teclado. */
export type ComposerSubmitOn =
  /** Enter envia; Shift+Enter quebra linha. Convenção de teclado físico. */
  | 'enter'
  /** Ctrl/Cmd+Enter envia; Enter quebra linha. É o certo no toque. */
  | 'modifier'

/** Rótulos que a interface mostra. Sem padrão em inglês escondido. */
export interface ComposerLabels {
  /** Nome acessível do campo. */
  input: string
  placeholder: string
  /** Nome do botão em repouso. */
  submit: string
  /** Nome do MESMO botão enquanto gera — troca de nome, não só de ícone. */
  stop: string
  /** A dica de teclado. `{key}` vira a combinação que envia. */
  hint: string
  /** Descrição do limite. `{max}` vira o número. */
  limit: string
}

/**
 * O vocabulário do SELETOR DO CARACTERE GATILHO.
 *
 * A máquina — onde o gatilho vale, o que ele recorta, como o filtro ordena e o
 * que fica escrito depois da escolha — vive em
 * `@shared/primitives/composer-trigger` e é compartilhada. O que mora aqui é só
 * o vocabulário que o composer expõe a quem consome.
 */

/** Uma opção do seletor. */
export interface TriggerOption {
  /** Endereço da opção. Vira o `id` do elemento, que o campo aponta. */
  id: string
  /** O que se lê na lista, e o que o filtro compara. */
  label: string
  /** Informação de apoio à direita — time, atalho, descrição curta. */
  hint?: string
  /**
   * O que fica escrito ao escolher. Sem ele, o caractere gatilho mais o rótulo.
   *
   * Existe porque o que se escreve nem sempre é o que se lê: um comando mostra
   * "Resumir a conversa" e escreve `/resumir`.
   */
  value?: string
}

/** Um gatilho e as opções que ele oferece. */
export interface TriggerSource {
  spec: TriggerSpec
  options: TriggerOption[]
}

/** O texto do painel. Não há padrão em inglês escondido. */
export interface TriggerPopoverLabels {
  /**
   * O que aparece quando o filtro não deixa nada.
   *
   * Texto, e não lista vazia: lista vazia é silêncio para quem não vê a tela, e
   * silêncio parece que a busca não respondeu.
   */
  empty: string
  /** Nome acessível da lista. */
  list: string
}
